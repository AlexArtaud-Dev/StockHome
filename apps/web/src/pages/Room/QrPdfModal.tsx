import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import QRCodeSVG from 'react-qr-code';
import { Modal } from '../../components/Modal/Modal';
import { Container } from '@stockhome/shared';
import formStyles from '../../components/Form/Form.module.css';
import styles from './QrPdfModal.module.css';

// Standard label sizes (label = QR + text below)
const QR_SIZES = [
  { label: 'XS — 2.5 cm', mm: 25 },
  { label: 'Small — 4 cm', mm: 40 },
  { label: 'Medium — 6 cm', mm: 60 },
  { label: 'Large — 8 cm', mm: 80 },
  { label: 'XL — 10 cm', mm: 100 },
] as const;

interface Props {
  /** Top-level containers the user selected */
  selectedIds: Set<string>;
  /** ALL containers in the room (used for recursive expansion) */
  allContainers: Container[];
  roomOrigin: string;
  onClose: () => void;
}

/** Render a single QR code SVG to an HTML string using React DOM */
function renderQrToString(url: string, pxSize: number): string {
  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => {
    root.render(<QRCodeSVG value={url} size={pxSize} level="M" />);
  });
  const html = div.querySelector('svg')?.outerHTML ?? '';
  root.unmount();
  return html;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Collect container IDs: selected + (optionally) all their descendants */
function collectIds(
  selectedIds: Set<string>,
  allContainers: Container[],
  recursive: boolean,
): string[] {
  if (!recursive) return [...selectedIds];

  const result = new Set<string>(selectedIds);
  const childMap = new Map<string | null, string[]>();
  for (const c of allContainers) {
    const parent = c.parentContainerId ?? null;
    if (!childMap.has(parent)) childMap.set(parent, []);
    childMap.get(parent)!.push(c.id);
  }

  function expand(id: string) {
    const children = childMap.get(id) ?? [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        expand(child);
      }
    }
  }

  for (const id of selectedIds) expand(id);
  return [...result];
}

export function QrPdfModal({ selectedIds, allContainers, roomOrigin, onClose }: Props) {
  const [recursive, setRecursive] = useState(false);
  const [sizeMm, setSizeMm] = useState(60);
  const [generating, setGenerating] = useState(false);

  const containerById = useMemo(
    () => new Map(allContainers.map((c) => [c.id, c])),
    [allContainers],
  );

  const finalIds = useMemo(
    () => collectIds(selectedIds, allContainers, recursive),
    [selectedIds, allContainers, recursive],
  );

  const finalContainers = finalIds
    .map((id) => containerById.get(id))
    .filter(Boolean) as Container[];

  function generate() {
    setGenerating(true);
    try {
      // ~96 DPI equivalent pixel size for the QR rendering
      const pxSize = Math.round((sizeMm / 25.4) * 96);
      const fontPt = Math.max(8, Math.round(sizeMm * 0.2));

      const items = finalContainers.map((c) => ({
        name: c.name,
        svg: renderQrToString(`${roomOrigin}/containers/${c.id}`, pxSize),
      }));

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QR Labels — StockHome</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, system-ui, sans-serif;
      background: white;
      color: #1e293b;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6mm;
    }
    .label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
      break-inside: avoid;
      page-break-inside: avoid;
      border: 0.3mm solid #e2e8f0;
      border-radius: 2mm;
      padding: 3mm;
    }
    .label svg {
      width: ${sizeMm}mm;
      height: ${sizeMm}mm;
      display: block;
    }
    .label-name {
      font-size: ${fontPt}pt;
      font-weight: 700;
      text-align: center;
      max-width: ${sizeMm}mm;
      word-break: break-word;
      line-height: 1.2;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${items.map((item) => `
    <div class="label">
      ${item.svg}
      <div class="label-name">${escapeHtml(item.name)}</div>
    </div>`).join('')}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
      onClose();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Modal title="Generate QR Labels PDF" onClose={onClose}>
      <div className={formStyles.form}>
        <div className={styles.summary}>
          <span className={styles.summaryCount}>{finalContainers.length}</span>
          <span className={styles.summaryLabel}>
            container{finalContainers.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Recursive toggle */}
        <div
          className={formStyles.checkRow}
          onClick={() => setRecursive((v) => !v)}
        >
          <input
            id="recursive"
            type="checkbox"
            checked={recursive}
            onChange={(e) => setRecursive(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="recursive" onClick={(e) => e.stopPropagation()}>
            Include all sub-containers (recursive)
          </label>
        </div>

        {/* Size selection */}
        <div className={formStyles.field}>
          <label>Label size</label>
          <div className={styles.sizeGrid}>
            {QR_SIZES.map((s) => (
              <button
                key={s.mm}
                type="button"
                className={`${styles.sizeOption} ${sizeMm === s.mm ? styles.sizeSelected : ''}`}
                onClick={() => setSizeMm(s.mm)}
              >
                <span className={styles.sizeMm}>{s.mm} mm</span>
                <span className={styles.sizeLabel}>{s.label.split('—')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview list */}
        {finalContainers.length > 0 && (
          <div className={styles.previewList}>
            <span className={styles.previewTitle}>Labels to print</span>
            <div className={styles.previewItems}>
              {finalContainers.map((c) => (
                <span key={c.id} className={styles.previewItem}>{c.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className={formStyles.actions}>
          <button
            type="button"
            className={formStyles.submitBtn}
            onClick={generate}
            disabled={generating || finalContainers.length === 0}
          >
            {generating ? 'Generating…' : `Print ${finalContainers.length} label${finalContainers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
