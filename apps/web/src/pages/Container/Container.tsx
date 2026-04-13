import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, ChevronRight, Edit2, Package, Plus, QrCode, X } from 'lucide-react';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import QRCodeSVG from 'react-qr-code';
import { Layout } from '../../components/Layout/Layout';
import { Modal } from '../../components/Modal/Modal';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Item } from '@stockhome/shared';
import { ItemForm } from './ItemForm';
import { ContainerForm } from '../Room/ContainerForm';
import styles from './Container.module.css';

export function ContainerPage() {
  const { id } = useParams<{ id: string }>();
  const [optimisticQuantities, setOptimisticQuantities] = useState<Record<string, number>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showEditContainer, setShowEditContainer] = useState(false);
  const [showAddSubContainer, setShowAddSubContainer] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const { data: container, refetch: refetchContainer } = useApi<Container>(
    (signal) => api.get(`/containers/${id!}`, signal),
    [id],
  );

  const { data: subContainers, refetch: refetchSubs } = useApi<Container[]>(
    (signal) => api.get(`/containers?parentContainerId=${id!}`, signal),
    [id],
  );

  const { data: items, isLoading, error, refetch } = useApi<Item[]>(
    (signal) => api.get(`/items?containerId=${id!}`, signal),
    [id],
  );

  const qrUrl = container
    ? `${window.location.origin}/containers/${container.id}`
    : '';

  async function adjustQuantity(item: Item, delta: number) {
    const prev = optimisticQuantities[item.id] ?? item.quantity;
    const next = Math.max(0, prev + delta);
    setOptimisticQuantities((s) => ({ ...s, [item.id]: next }));
    try {
      await api.patch(`/items/${item.id}/quantity`, { delta });
    } catch {
      setOptimisticQuantities((s) => ({ ...s, [item.id]: item.quantity }));
      refetch();
    }
  }

  const CONTAINER_TYPE_ICONS: Record<string, string> = {
    box: '📦', shelf: '🗄️', drawer: '🗂️', bag: '👜', other: '📁',
  };

  return (
    <Layout
      title={container?.name ?? 'Container'}
      showBack
      actions={
        <>
          <Tooltip content="QR code">
            <button className={styles.iconBtn} onClick={() => setShowQr(true)} aria-label="Show QR code">
              <QrCode size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Add sub-container">
            <button className={styles.iconBtn} onClick={() => setShowAddSubContainer(true)} aria-label="Add sub-container">
              <Box size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Edit container">
            <button className={styles.iconBtn} onClick={() => setShowEditContainer(true)} aria-label="Edit container">
              <Edit2 size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Add item">
            <button className={styles.iconBtn} onClick={() => setShowAddItem(true)} aria-label="Add item">
              <Plus size={20} />
            </button>
          </Tooltip>
        </>
      }
    >
      {/* Sub-containers */}
      {subContainers && subContainers.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sub-containers</h2>
          <div className={styles.subContainerGrid}>
            {subContainers.map((sub) => (
              <Link key={sub.id} to={`/containers/${sub.id}`} className={styles.subContainerCard}>
                <span className={styles.subContainerIcon}>{CONTAINER_TYPE_ICONS[sub.type] ?? '📁'}</span>
                <div className={styles.subContainerInfo}>
                  <span className={styles.subContainerName}>{sub.name}</span>
                  {sub.description && <span className={styles.subContainerDesc}>{sub.description}</span>}
                </div>
                <ChevronRight size={16} className={styles.subContainerChevron} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Items */}
      <section className={styles.section}>
        {(subContainers && subContainers.length > 0) && (
          <h2 className={styles.sectionTitle}>Items</h2>
        )}

        {isLoading && <p className={styles.loading}>Loading…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {!isLoading && !error && items?.length === 0 && (subContainers?.length ?? 0) === 0 && (
          <div className={styles.empty}>
            <Package size={40} strokeWidth={1.5} />
            <p>This container is empty</p>
            <button className={styles.emptyBtn} onClick={() => setShowAddItem(true)}>
              Add first item
            </button>
          </div>
        )}

        {!isLoading && !error && items?.length === 0 && (subContainers?.length ?? 0) > 0 && (
          <p className={styles.emptyInline}>No items directly in this container.</p>
        )}

        <div className={styles.itemList}>
          {items?.map((item) => {
            const qty = optimisticQuantities[item.id] ?? item.quantity;
            const isLow = item.stockRule?.minQuantity != null && qty < item.stockRule.minQuantity;
            return (
              <div key={item.id} className={`${styles.itemRow} ${isLow ? styles.itemRowLow : ''}`}>
                <button className={styles.itemName} onClick={() => setEditItem(item)}>
                  <span className={styles.itemNameText}>{item.name}</span>
                  {item.tags && item.tags.length > 0 && (
                    <span className={styles.itemTags}>
                      {item.tags.map((t) => t.name).join(' · ')}
                    </span>
                  )}
                  {isLow && (
                    <span className={styles.itemLowBadge}>Low stock</span>
                  )}
                </button>
                <div className={styles.quantityControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => adjustQuantity(item, -1)}
                    disabled={qty === 0}
                    aria-label="Decrease"
                  >−</button>
                  <span className={styles.qty}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => adjustQuantity(item, 1)}
                    aria-label="Increase"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QR code modal */}
      {showQr && container && (
        <Modal title="Container QR Code" onClose={() => setShowQr(false)}>
          <div className={styles.qrModal}>
            <p className={styles.qrDesc}>Scan to open <strong>{container.name}</strong> on any device.</p>
            <div className={styles.qrWrapper} id="qr-wrapper">
              <QRCodeSVG value={qrUrl} size={220} level="M" id="qr-svg" />
              <p className={styles.qrName}>{container.name}</p>
            </div>
            <p className={styles.qrUrl}>{qrUrl}</p>
            <button className={styles.qrDownload} onClick={() => {
              // react-qr-code sets viewBox="0 0 {moduleCount} {moduleCount}" (e.g. 29×29),
              // not pixel coordinates. Cloning the full SVG element and nesting it
              // preserves its own viewBox so it renders at the correct size.
              const qrSvgEl = document.getElementById('qr-svg') as SVGSVGElement | null;
              if (!qrSvgEl) return;
              const padding = 20;
              const qrSize = 220;
              const fontSize = 18;
              const labelH = fontSize + 20;
              const totalW = qrSize + padding * 2;
              const totalH = qrSize + padding * 2 + labelH;
              const svgNs = 'http://www.w3.org/2000/svg';
              const wrapper = document.createElementNS(svgNs, 'svg');
              wrapper.setAttribute('xmlns', svgNs);
              wrapper.setAttribute('width', String(totalW));
              wrapper.setAttribute('height', String(totalH));
              wrapper.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
              const bg = document.createElementNS(svgNs, 'rect');
              bg.setAttribute('width', String(totalW));
              bg.setAttribute('height', String(totalH));
              bg.setAttribute('fill', 'white');
              wrapper.appendChild(bg);
              // Clone the full QR SVG (preserves viewBox + width + height),
              // then position it as a nested <svg> at (padding, padding)
              const qrClone = qrSvgEl.cloneNode(true) as SVGSVGElement;
              qrClone.setAttribute('x', String(padding));
              qrClone.setAttribute('y', String(padding));
              qrClone.setAttribute('width', String(qrSize));
              qrClone.setAttribute('height', String(qrSize));
              wrapper.appendChild(qrClone);
              const text = document.createElementNS(svgNs, 'text');
              text.setAttribute('x', String(totalW / 2));
              text.setAttribute('y', String(qrSize + padding * 2 + fontSize));
              text.setAttribute('text-anchor', 'middle');
              text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
              text.setAttribute('font-size', String(fontSize));
              text.setAttribute('font-weight', '700');
              text.setAttribute('fill', '#1e293b');
              text.textContent = container.name;
              wrapper.appendChild(text);
              const blob = new Blob([wrapper.outerHTML], { type: 'image/svg+xml' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${container.name}-qr.svg`;
              a.click();
            }}>
              Download SVG
            </button>
          </div>
        </Modal>
      )}

      {showAddItem && container && (
        <ItemForm
          containerId={container.id}
          roomId={container.roomId}
          onClose={() => setShowAddItem(false)}
          onSaved={refetch}
        />
      )}
      {editItem && container && (
        <ItemForm
          containerId={container.id}
          roomId={container.roomId}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={refetch}
        />
      )}
      {showEditContainer && container && (
        <ContainerForm
          roomId={container.roomId}
          container={container}
          onClose={() => setShowEditContainer(false)}
          onSaved={() => { refetchContainer(); refetch(); }}
        />
      )}
      {showAddSubContainer && container && (
        <ContainerForm
          roomId={container.roomId}
          parentContainerId={container.id}
          onClose={() => setShowAddSubContainer(false)}
          onSaved={refetchSubs}
        />
      )}
    </Layout>
  );
}
