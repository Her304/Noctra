#!/usr/bin/env python3
"""Mint the pipeline's Supabase token. Run locally, never in CI.

PostgREST reads the `role` claim of the request JWT and SET ROLEs to it for the
duration of the request, so a token signed for `pipeline_writer` carries exactly
the privileges granted in 20260907000001_role_grants.sql -- insert, scoped
update, and no way to delete anything.

CI holds the *token*, not the JWT secret. That distinction is the point: the
secret can mint a `service_role` token, which bypasses RLS entirely, so a
GitHub Actions log leak of the secret would be a full database compromise. A
leak of this token is a role with no DELETE privilege.

Usage:
    export SUPABASE_JWT_SECRET='...'      # Dashboard > Settings > API > JWT Secret
    python pipeline/mint_pipeline_token.py --years 5

Then store the output as the SUPABASE_PIPELINE_TOKEN repository secret.

Stdlib only, deliberately: this runs once every few years on a laptop, and a
signing tool is the last place to want a dependency you have not read.
"""

import argparse
import base64
import hashlib
import hmac
import json
import os
import sys
from datetime import datetime, timedelta, timezone

ROLE = "pipeline_writer"


def b64url(raw: bytes) -> str:
    """JWT uses base64url with the padding stripped."""
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def sign_hs256(payload: dict, secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    segments = [
        b64url(json.dumps(header, separators=(",", ":")).encode()),
        b64url(json.dumps(payload, separators=(",", ":")).encode()),
    ]
    signing_input = ".".join(segments).encode("ascii")
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    return ".".join(segments + [b64url(signature)])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--years",
        type=int,
        default=5,
        help="token lifetime; rotate on this cadence (default: 5)",
    )
    args = parser.parse_args()

    secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not secret:
        raise SystemExit(
            "missing SUPABASE_JWT_SECRET\n"
            "Supabase Dashboard > Project Settings > API > JWT Settings > JWT Secret"
        )

    issued = datetime.now(timezone.utc)
    expires = issued + timedelta(days=365 * args.years)

    token = sign_hs256(
        {
            "role": ROLE,
            "iss": "supabase",
            "iat": int(issued.timestamp()),
            "exp": int(expires.timestamp()),
        },
        secret,
    )

    # The token goes to stdout alone so `... | pbcopy` works; everything else is
    # stderr, so a redirect to a file captures only the credential.
    print(f"role:    {ROLE}", file=sys.stderr)
    print(f"expires: {expires:%Y-%m-%d}", file=sys.stderr)
    print("store as: SUPABASE_PIPELINE_TOKEN (GitHub repo secret)", file=sys.stderr)
    print(file=sys.stderr)
    print(token)


if __name__ == "__main__":
    main()
