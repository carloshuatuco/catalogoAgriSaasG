"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";
import { db, getProductsRef } from "@/lib/firebase/firestore";
import { writeBatch, doc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store/useAuthStore";

// ------------------------------------
// Column name aliases (case-insensitive)
// ------------------------------------
const ALIAS_MAP: Record<string, string[]> = {
  name: ["producto", "nombre", "product", "name"],
  description: ["descripcion", "description", "descripción", "detalle", "detalles"],
  category: ["clase", "category", "categoria", "categoría", "tipo"],
  substance: ["composicion", "sustancia", "sustancia activa", "composición", "composition", "substance"],
  basePrice: ["precio", "price", "precio base", "base price", "costo"],
  unitMeasure: ["unidad medida", "unidad", "unit", "unit measure", "medida"],
};

function resolveHeader(header: string): string | null {
  const normalized = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

export interface ParsedProduct {
  name: string;
  description: string;
  category: string;
  substance: string;
  basePrice: number | null;
  unitMeasure: string;
  image: string;
  stock: boolean;
  featured: boolean;
  onSale: boolean;
  variants: { name: string; price: number }[];
  _rowIndex: number;
  _valid: boolean;
  _error?: string;
}

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const { store } = useAuthStore();
  const [step, setStep] = useState<"upload" | "preview" | "uploading" | "done">("upload");
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    setParseError(null);
    if (!file.name.endsWith(".csv")) {
      setParseError("Por favor sube un archivo en formato .CSV (Valores separados por comas).");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const headerMapping: Record<string, string> = {};
        for (const h of rawHeaders) {
          const resolved = resolveHeader(h);
          if (resolved) headerMapping[h] = resolved;
        }

        if (!Object.values(headerMapping).includes("name")) {
          setParseError(
            'No se encontró la columna de "Producto" o "Nombre". Asegúrate de que tu planilla tenga esa columna.'
          );
          return;
        }

        const parsed: ParsedProduct[] = (results.data as Record<string, string>[]).map(
          (row, idx) => {
            const mapped: Record<string, string> = {};
            for (const [original, fieldName] of Object.entries(headerMapping)) {
              mapped[fieldName] = row[original]?.trim() || "";
            }

            const name = mapped.name || "";
            const rawPrice = mapped.basePrice || "";
            const price = rawPrice !== "" && !isNaN(Number(rawPrice)) ? Number(rawPrice) : null;

            // Build description: combine description + unit measure if available
            let desc = mapped.description || "";
            if (mapped.unitMeasure) {
              desc = desc ? `${desc} | Unidad: ${mapped.unitMeasure}` : `Unidad: ${mapped.unitMeasure}`;
            }

            return {
              name,
              description: desc,
              category: mapped.category || "",
              substance: mapped.substance || "",
              basePrice: price,
              unitMeasure: mapped.unitMeasure || "",
              image: "",
              stock: true,
              featured: false,
              onSale: false,
              variants: [],
              _rowIndex: idx + 2,
              _valid: name.length > 0,
              _error: name.length === 0 ? "Sin nombre de producto" : undefined,
            };
          }
        );

        if (parsed.length === 0) {
          setParseError("El archivo está vacío o no tiene datos válidos.");
          return;
        }

        setProducts(parsed);
        setStep("preview");
      },
      error: (err) => {
        setParseError(`Error al leer el archivo: ${err.message}`);
      },
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const validProducts = products.filter((p) => p._valid);
  const invalidProducts = products.filter((p) => !p._valid);

  const handleConfirmUpload = async () => {
    if (!store || validProducts.length === 0) return;
    setStep("uploading");

    try {
      const productsRef = getProductsRef(store.id);
      const BATCH_SIZE = 499;
      let count = 0;

      for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = validProducts.slice(i, i + BATCH_SIZE);
        for (const p of chunk) {
          const newDocRef = doc(productsRef);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _rowIndex, _valid, _error, unitMeasure, ...productData } = p;
          // Only include basePrice if it's not null
          const firestoreData: Record<string, unknown> = { ...productData };
          if (productData.basePrice === null) {
            delete firestoreData.basePrice;
          }
          batch.set(newDocRef, firestoreData);
        }
        await batch.commit();
        count += chunk.length;
      }

      setUploadedCount(count);
      setStep("done");
      onSuccess(count);
    } catch (err) {
      console.error("Error en carga masiva:", err);
      setParseError("Ocurrió un error al subir los productos. Intenta de nuevo.");
      setStep("preview");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0b3d32] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-green-300" />
            <h3 className="font-bold text-lg tracking-wide">Carga Masiva desde CSV</h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* STEP: Upload */}
          {step === "upload" && (
            <div className="p-8 flex flex-col gap-6">
              {/* Instructions */}
              <div className="bg-[#f0f9f6] border border-[#156d5e]/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-[#156d5e] mt-0.5 shrink-0" />
                <div className="text-sm text-[#0b3d32] space-y-1">
                  <p className="font-bold">¿Cómo exportar tu Google Sheet como CSV?</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[#156d5e]/90">
                    <li>Abre tu planilla en Google Sheets.</li>
                    <li>Ve a <strong>Archivo</strong> → <strong>Descargar</strong> → <strong>Valores separados por comas (.csv)</strong>.</li>
                    <li>Sube ese archivo aquí.</li>
                  </ol>
                </div>
              </div>

              {/* Column guide */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-2 bg-gray-50 border-b border-gray-100">
                  Columnas reconocidas automáticamente
                </p>
                <div className="divide-y divide-gray-50">
                  {[
                    { col: "Producto / Nombre", field: "Nombre del producto", required: true },
                    { col: "Descripción / Detalle", field: "Descripción", required: false },
                    { col: "Clase / Categoría", field: "Categoría", required: false },
                    { col: "Composición / Sustancia activa", field: "Sustancia activa", required: false },
                    { col: "Precio / Precio base", field: "Precio base (S/)", required: false },
                    { col: "Unidad / Unidad medida", field: "Se añade a la descripción", required: false },
                  ].map((item) => (
                    <div key={item.col} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-mono text-xs text-[#156d5e] bg-[#f0f9f6] px-2 py-0.5 rounded">
                        {item.col}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-300 mx-2 shrink-0" />
                      <span className="text-gray-600 flex-1">{item.field}</span>
                      {item.required ? (
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Requerido</span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Opcional</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#156d5e] bg-[#f0f9f6]"
                    : "border-gray-200 bg-gray-50 hover:border-[#156d5e]/50 hover:bg-[#f0f9f6]/50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragging ? "text-[#156d5e]" : "text-gray-300"}`} />
                <p className="font-bold text-gray-600 text-sm">Arrastra tu archivo CSV aquí</p>
                <p className="text-xs text-gray-400 mt-1">o haz clic para explorar tus archivos</p>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP: Preview */}
          {step === "preview" && (
            <div className="flex flex-col gap-0">
              {/* Summary bar */}
              <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm shrink-0">
                <span className="text-gray-600">
                  <strong className="text-gray-900">{products.length}</strong> filas leídas
                </span>
                <span className="text-green-700 font-semibold">
                  ✓ {validProducts.length} válidos
                </span>
                {invalidProducts.length > 0 && (
                  <span className="text-red-600 font-semibold">
                    ✗ {invalidProducts.length} con error
                  </span>
                )}
                <button
                  onClick={() => { setProducts([]); setStep("upload"); setParseError(null); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-700 underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 text-sm mx-6 mt-4 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 w-8">#</th>
                      <th className="px-4 py-3 min-w-[150px]">Nombre</th>
                      <th className="px-4 py-3 min-w-[100px]">Categoría</th>
                      <th className="px-4 py-3 min-w-[130px]">Sustancia Activa</th>
                      <th className="px-4 py-3 min-w-[200px]">Descripción</th>
                      <th className="px-4 py-3 w-24 text-right">Precio</th>
                      <th className="px-4 py-3 w-16 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((p) => (
                      <tr
                        key={p._rowIndex}
                        className={`${p._valid ? "hover:bg-gray-50" : "bg-red-50/40"} transition-colors`}
                      >
                        <td className="px-4 py-3 text-gray-400">{p._rowIndex}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-normal max-w-[180px]">
                          {p.name || <span className="text-red-400 italic">Sin nombre</span>}
                        </td>
                        <td className="px-4 py-3">
                          {p.category ? (
                            <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                              {p.category}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-normal max-w-[150px]">
                          {p.substance || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-normal max-w-[220px] leading-relaxed">
                          {p.description
                            ? p.description.length > 80
                              ? p.description.slice(0, 80) + "…"
                              : p.description
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {p.basePrice !== null ? (
                            <span className="text-[#156d5e] font-bold">S/ {p.basePrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p._valid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <span title={p._error}>
                              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP: Uploading */}
          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
              <div className="w-16 h-16 rounded-full bg-[#f0f9f6] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#156d5e] animate-spin" />
              </div>
              <p className="font-bold text-gray-800 text-lg">Subiendo productos...</p>
              <p className="text-sm text-gray-500">Procesando {validProducts.length} productos. Por favor espera.</p>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <p className="font-bold text-gray-800 text-xl">¡Carga Exitosa!</p>
              <p className="text-sm text-gray-500">
                Se subieron <strong className="text-[#156d5e]">{uploadedCount} productos</strong> a tu catálogo correctamente.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-8 py-2.5 bg-[#156d5e] hover:bg-[#0b3d32] text-white font-bold rounded-xl transition-all shadow-md"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "upload" || step === "preview") && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            {step === "preview" && validProducts.length > 0 && (
              <button
                onClick={handleConfirmUpload}
                className="px-6 py-2.5 bg-[#156d5e] hover:bg-[#0b3d32] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Confirmar y subir {validProducts.length} productos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
