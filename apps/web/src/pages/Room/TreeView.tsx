import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Package, Plus, Box, Edit2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { Container, Item } from '@stockhome/shared';
import { ContainerForm } from './ContainerForm';
import { ItemForm } from '../Container/ItemForm';
import styles from './TreeView.module.css';

const CONTAINER_TYPE_ICONS: Record<string, string> = {
  box: '📦', shelf: '🗄️', drawer: '🗂️', bag: '👜', other: '📁',
};

interface TreeNode {
  container: Container;
  children: TreeNode[];
  items: Item[];
}

function buildTree(containers: Container[], items: Item[], parentId: string | null): TreeNode[] {
  return containers
    .filter((c) => c.parentContainerId === parentId)
    .map((c) => ({
      container: c,
      children: buildTree(containers, items, c.id),
      items: items.filter((i) => i.containerId === c.id),
    }));
}

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  selected: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string | null) => void;
  onAddItem: (containerId: string, roomId: string) => void;
  onAddSub: (containerId: string, roomId: string) => void;
  onEditContainer: (container: Container) => void;
  onEditItem: (item: Item) => void;
}

function TreeNodeRow({
  node,
  depth,
  expanded,
  selected,
  onToggle,
  onSelect,
  onAddItem,
  onAddSub,
  onEditContainer,
  onEditItem,
}: TreeNodeProps) {
  const { t } = useTranslation();
  const { container, children, items } = node;
  const isExpanded = expanded.has(container.id);
  const isSelected = selected === container.id;
  const hasChildren = children.length > 0 || items.length > 0;

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.nodeRow} ${isSelected ? styles.nodeSelected : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          className={styles.expandBtn}
          onClick={() => onToggle(container.id)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren
            ? isExpanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
            : <span className={styles.leafDot} />}
        </button>

        <button
          className={styles.nodeLabel}
          onClick={() => onSelect(isSelected ? null : container.id)}
        >
          <span className={styles.nodeIcon}>{CONTAINER_TYPE_ICONS[container.type] ?? '📁'}</span>
          <span className={styles.nodeName}>{container.name}</span>
          {items.length > 0 && (
            <span className={styles.nodeCount}>{items.length}</span>
          )}
        </button>

        <div className={styles.nodeActions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onAddItem(container.id, container.roomId); }}
            title={t('treeView.addItem')}
          >
            <Package size={13} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onAddSub(container.id, container.roomId); }}
            title={t('treeView.addSubContainer')}
          >
            <Box size={13} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onEditContainer(container); }}
            title={t('treeView.editContainer')}
          >
            <Edit2 size={13} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.nodeChildren}>
          {children.map((child) => (
            <TreeNodeRow
              key={child.container.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddItem={onAddItem}
              onAddSub={onAddSub}
              onEditContainer={onEditContainer}
              onEditItem={onEditItem}
            />
          ))}
          {items.map((item) => (
            <div
              key={item.id}
              className={styles.itemRow}
              style={{ paddingLeft: `${12 + (depth + 1) * 20}px` }}
            >
              <span className={styles.itemDot} />
              <button className={styles.itemLabel} onClick={() => onEditItem(item)}>
                <Package size={13} className={styles.itemIcon} />
                <span className={styles.itemName}>{item.name}</span>
                {item.quantity !== 1 && (
                  <span className={styles.itemQty}>×{item.quantity}</span>
                )}
                {item.tags && item.tags.length > 0 && (
                  <span className={styles.itemTags}>{item.tags.map((tag) => tag.name).join(' · ')}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TreeViewProps {
  roomId: string;
}

export function TreeView({ roomId }: TreeViewProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [addItemTarget, setAddItemTarget] = useState<{ containerId: string; roomId: string } | null>(null);
  const [addSubTarget, setAddSubTarget] = useState<{ containerId: string; roomId: string } | null>(null);
  const [editContainer, setEditContainer] = useState<Container | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const { data: containers, refetch: refetchContainers } = useApi<Container[]>(
    (signal) => api.get(`/containers?roomId=${roomId}`, signal),
    [roomId],
  );

  const { data: items, refetch: refetchItems } = useApi<Item[]>(
    (signal) => api.get(`/items?roomId=${roomId}`, signal),
    [roomId],
  );

  const tree = useMemo(
    () => buildTree(containers ?? [], items ?? [], null),
    [containers, items],
  );

  const allContainerIds = useMemo(
    () => (containers ?? []).map((c) => c.id),
    [containers],
  );

  function expandAll() {
    setExpanded(new Set(allContainerIds));
  }

  function collapseAll() {
    setExpanded(new Set());
    setSelected(null);
  }

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleAddItem(containerId: string, rId: string) {
    setAddItemTarget({ containerId, roomId: rId });
  }

  function handleAddSub(containerId: string, rId: string) {
    setAddSubTarget({ containerId, roomId: rId });
  }

  const refetchAll = useCallback(() => {
    refetchContainers();
    refetchItems();
  }, [refetchContainers, refetchItems]);

  if (!containers || !items) {
    return <p className={styles.loading}>{t('common.loading')}</p>;
  }

  if (tree.length === 0) {
    return <p className={styles.empty}>{t('room.noContainers')}</p>;
  }

  return (
    <div className={styles.treeView}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={expandAll}>{t('treeView.expandAll')}</button>
        <button className={styles.toolbarBtn} onClick={collapseAll}>{t('treeView.collapseAll')}</button>
      </div>

      <div className={styles.tree}>
        {tree.map((node) => (
          <TreeNodeRow
            key={node.container.id}
            node={node}
            depth={0}
            expanded={expanded}
            selected={selected}
            onToggle={toggle}
            onSelect={setSelected}
            onAddItem={handleAddItem}
            onAddSub={handleAddSub}
            onEditContainer={setEditContainer}
            onEditItem={setEditItem}
          />
        ))}
      </div>

      {addItemTarget && (
        <ItemForm
          containerId={addItemTarget.containerId}
          roomId={addItemTarget.roomId}
          onClose={() => setAddItemTarget(null)}
          onSaved={refetchAll}
        />
      )}
      {addSubTarget && (
        <ContainerForm
          roomId={addSubTarget.roomId}
          parentContainerId={addSubTarget.containerId}
          onClose={() => setAddSubTarget(null)}
          onSaved={refetchAll}
        />
      )}
      {editContainer && (
        <ContainerForm
          roomId={editContainer.roomId}
          container={editContainer}
          onClose={() => setEditContainer(null)}
          onSaved={refetchAll}
        />
      )}
      {editItem && (
        <ItemForm
          containerId={editItem.containerId ?? ''}
          roomId={editItem.roomId}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={refetchAll}
        />
      )}
    </div>
  );
}
