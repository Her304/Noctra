"use client";

import { useActionState } from "react";
import { setLinkageStrength, setLinkageVerdict } from "@/lib/admin/actions";
import type { AdminLinkage } from "@/lib/admin/types";

export default function LinkageRow({
  linkage,
  floor,
}: {
  linkage: AdminLinkage;
  floor: number;
}) {
  const [verdictState, submitVerdict, verdictPending] = useActionState(
    setLinkageVerdict,
    null
  );
  const [strengthState, submitStrength, strengthPending] = useActionState(
    setLinkageStrength,
    null
  );

  const strength = linkage.strength ?? 0;
  const hidden = linkage.is_linked && strength < floor;

  const status = !linkage.is_linked
    ? { label: "Retired", tone: "retired" }
    : hidden
      ? { label: "Below floor", tone: "hidden" }
      : { label: "Drawn", tone: "drawn" };

  const error =
    (verdictState && !verdictState.ok && verdictState.error) ||
    (strengthState && !strengthState.ok && strengthState.error) ||
    null;

  return (
    <li className={`linkage linkage-${status.tone}`}>
      <div className="linkage-head">
        <span className={`linkage-status mono-meta linkage-status-${status.tone}`}>
          {status.label}
        </span>
        <span className="mono-meta linkage-meta">
          cosine {linkage.similarity.toFixed(2)} · {linkage.model_used ?? "unknown model"}
        </span>
      </div>

      <p className="linkage-pair">
        <span className="linkage-node">{linkage.source_title}</span>
        <span className="linkage-arrow" aria-hidden="true">
          →
        </span>
        <span className="linkage-node">{linkage.target_title}</span>
      </p>

      {linkage.explanation ? (
        <p className="linkage-why">{linkage.explanation}</p>
      ) : (
        <p className="linkage-why linkage-why-absent">No explanation recorded.</p>
      )}

      <div className="linkage-controls">
        <form action={submitStrength} className="linkage-strength">
          <input type="hidden" name="id" value={linkage.id} />
          <label className="mono-meta" htmlFor={`strength-${linkage.id}`}>
            Strength
          </label>
          <input
            id={`strength-${linkage.id}`}
            name="strength"
            type="number"
            step="0.05"
            min="0"
            max="1"
            defaultValue={strength.toFixed(2)}
            className="admin-input admin-input-num"
          />
          <button type="submit" className="btn btn-ghost" disabled={strengthPending}>
            {strengthPending ? "Saving…" : "Set"}
          </button>
        </form>

        <form action={submitVerdict}>
          <input type="hidden" name="id" value={linkage.id} />
          <input
            type="hidden"
            name="is_linked"
            value={linkage.is_linked ? "false" : "true"}
          />
          <button
            type="submit"
            className={`btn ${linkage.is_linked ? "btn-ghost" : "btn-ember"}`}
            disabled={verdictPending}
          >
            {verdictPending
              ? "Saving…"
              : linkage.is_linked
                ? "Retire edge"
                : "Restore edge"}
          </button>
        </form>
      </div>

      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
