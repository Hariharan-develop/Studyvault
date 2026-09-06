import React, { useState } from "react";
import { Plus, Check, X, BookOpen, Trash2 } from "lucide-react";
import { useSubjects } from "../../context/SubjectContext";

interface SubjectSelectorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  allowAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  required?: boolean;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  id = "subject-selector",
  value,
  onChange,
  label,
  placeholder = "Select or add subject...",
  allowAllOption = false,
  allOptionLabel = "All Subjects",
  className = "",
  required = false,
}) => {
  const { subjects, addSubject, removeSubject } = useSubjects();
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [manageMode, setManageMode] = useState<boolean>(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__ADD_CUSTOM__") {
      setIsAddingCustom(true);
    } else {
      onChange(selected);
    }
  };

  const handleAddCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const added = await addSubject(trimmed);
      if (added) {
        onChange(added);
      }
      setCustomInput("");
      setIsAddingCustom(false);
    } catch (err) {
      console.error("Failed to add custom subject:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelCustom = () => {
    setIsAddingCustom(false);
    setCustomInput("");
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {!isAddingCustom ? (
        <div className="relative flex items-center gap-1.5">
          <select
            id={id}
            value={value}
            onChange={handleSelectChange}
            required={required}
            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 transition"
          >
            {allowAllOption && <option value="all">{allOptionLabel}</option>}
            {!allowAllOption && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}

            {/* Custom subjects added by user */}
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}

            {/* If selected value is not in subjects list (e.g., initial or prop), display it */}
            {value && value !== "all" && !subjects.includes(value) && (
              <option value={value}>{value}</option>
            )}

            {/* Only "+ Custom Subject" option per user prompt */}
            <option value="__ADD_CUSTOM__" className="text-indigo-600 font-semibold">
              + Custom Subject
            </option>
          </select>

          {/* Quick toggle to add custom */}
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            title="Add Custom Subject"
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center shrink-0 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {subjects.length > 0 && (
            <button
              type="button"
              onClick={() => setManageMode(!manageMode)}
              title={manageMode ? "Done managing" : "Manage subjects"}
              className={`p-2 rounded-xl text-xs transition shrink-0 ${
                manageMode ? "bg-amber-100 text-amber-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Inline Custom Subject Input Form */
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-2 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900">
            <span>Type Your Custom Subject:</span>
            <button
              type="button"
              onClick={handleCancelCustom}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                } else if (e.key === "Escape") {
                  handleCancelCustom();
                }
              }}
              placeholder="e.g. Organic Chemistry, Macroeconomics..."
              className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            <button
              type="button"
              onClick={() => handleAddCustom()}
              disabled={isSaving || !customInput.trim()}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 transition"
            >
              <Check className="w-3 h-3" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={handleCancelCustom}
              className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold shrink-0 transition"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-indigo-700/80">
            Saved subjects appear across Study Materials, Smart Notes, Chat & Planner.
          </p>
        </div>
      )}

      {/* Manage Subjects Panel if toggled */}
      {manageMode && subjects.length > 0 && !isAddingCustom && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 mt-1 max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Your Custom Subjects ({subjects.length})</span>
            <button
              type="button"
              onClick={() => setManageMode(false)}
              className="text-indigo-600 hover:underline text-[10px] normal-case font-semibold"
            >
              Done
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium"
              >
                <span>{sub}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeSubject(sub);
                    if (value === sub) onChange("");
                  }}
                  className="text-slate-400 hover:text-red-600 transition"
                  title={`Delete "${sub}"`}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
