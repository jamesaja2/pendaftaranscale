"use client";
import React, { useState, useEffect } from "react";
import { searchStudents, StudentResult } from "@/actions/student";

interface StudentSelectProps {
  label: string;
  onSelect: (student: StudentResult) => void;
  selectedStudent?: StudentResult | null; // For editing or if already selected
  placeholder?: string;
  resetOnSelect?: boolean;
}

export default function StudentSelect({ label, onSelect, selectedStudent, placeholder, resetOnSelect }: StudentSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<StudentResult | null>(selectedStudent || null);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3 && isOpen) {
        setLoading(true);
        const res = await searchStudents(query);
        setResults(res);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  const handleSelect = (s: StudentResult) => {
      onSelect(s);
      
      if (resetOnSelect) {
        setSelected(null);
      } else {
        setSelected(s);
      }
      
      setIsOpen(false);
      setQuery("");
  };

  const handleRemove = () => {
      setSelected(null);
      // Hack: pass empty student
      onSelect({ nis: "", name: "", class: "", absen: "" }); 
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1 dark:text-gray-300">{label}</label>
      
      {selected && selected.nis ? (
          <div className="flex items-center justify-between p-3 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div>
                  <div className="font-semibold text-gray-800 dark:text-white">{selected.name}</div>
                  <div className="text-xs text-gray-500">{selected.class} - {selected.absen ? `No. ${selected.absen}` : selected.nis}</div>
              </div>
              <button 
                type="button" 
                onClick={handleRemove} 
                className="text-red-500 hover:text-red-700 text-sm px-2"
              >
                  Change
              </button>
          </div>
      ) : (
          <div className="relative">
              <input 
                 type="text" 
                 className="w-full p-3 border rounded dark:bg-gray-900 dark:border-gray-700" 
                 placeholder={placeholder || "Type at least 3 chars..."} 
                 value={query}
                 onChange={(e) => {
                     setQuery(e.target.value);
                     if (!isOpen) setIsOpen(true);
                 }}
                 onFocus={() => setIsOpen(true)}
              />
              {loading && <div className="absolute right-3 top-3 text-gray-400 text-sm">Searching...</div>}
              
              {isOpen && results.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {results.map((s) => (
                          <li 
                            key={s.nis} 
                            onClick={() => handleSelect(s)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-0 dark:border-gray-700"
                          >
                              <div className="font-medium text-sm">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.class} - {s.absen ? `No. ${s.absen}` : s.nis}</div>
                          </li>
                      ))}
                  </ul>
              )}
              {isOpen && query.length >= 3 && results.length === 0 && !loading && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border p-2 text-sm text-gray-500">
                      No students found.
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
