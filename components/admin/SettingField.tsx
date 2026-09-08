"use client";

import { useActionState } from "react";
import { updateSetting } from "@/lib/admin/actions";

export default function SettingField({
  settingKey,
  value,
  description,
  updatedAt,
  input,
}: {
  settingKey: string;
  value: number;
  description: string | null;
  updatedAt: string;
  input: { step: number; min: number; max: number };
}) {
  const [state, submit, pending] = useActionState(updateSetting, null);

  return (
    <form action={submit} className="setting">
      <input type="hidden" name="key" value={settingKey} />

      <div className="setting-copy">
        <label className="setting-key mono-meta" htmlFor={`setting-${settingKey}`}>
          {settingKey}
        </label>
        {description ? <p className="setting-desc">{description}</p> : null}
        <p className="mono-meta setting-stamp">
          Last changed {new Date(updatedAt).toLocaleString("en-CA")}
        </p>
      </div>

      <div className="setting-control">
        <input
          id={`setting-${settingKey}`}
          name="value"
          type="number"
          step={input.step}
          min={input.min}
          max={input.max}
          defaultValue={value}
          className="admin-input admin-input-num"
        />
        <button type="submit" className="btn btn-ghost" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {state?.ok ? (
        <p className="mono-meta admin-ok setting-feedback">
          Saved — public pages refresh within five minutes.
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="admin-error setting-feedback" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
