package edu.spit.cache.index;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Generic in-memory B-tree (minimum degree 3) with inclusive ordered range scans. */
public final class BTreeIndex<V> {
    private static final int DEGREE = 3;
    private Node<V> root = new Node<>(true);
    private int size;

    public synchronized V get(String key) { return search(root, key); }

    public synchronized void put(String key, V value) {
        Objects.requireNonNull(key, "key");
        Objects.requireNonNull(value, "value");
        if (replace(root, key, value)) return;
        if (root.keys.size() == 2 * DEGREE - 1) {
            Node<V> parent = new Node<>(false);
            parent.children.add(root);
            splitChild(parent, 0);
            root = parent;
        }
        insertNonFull(root, key, value);
        size++;
    }

    /** Rebuild-based deletion is simple, deterministic, and adequate for an in-memory teaching index. */
    public synchronized void delete(String key) {
        if (get(key) == null) return;
        List<Map.Entry<String, V>> entries = new ArrayList<>();
        traverse(root, entries);
        root = new Node<>(true);
        size = 0;
        for (Map.Entry<String, V> entry : entries) {
            if (!entry.getKey().equals(key)) put(entry.getKey(), entry.getValue());
        }
    }

    public synchronized Map<String, V> rangeQuery(String first, String last) {
        if (first.compareTo(last) > 0) throw new IllegalArgumentException("range start must be <= end");
        LinkedHashMap<String, V> result = new LinkedHashMap<>();
        range(root, first, last, result);
        return Collections.unmodifiableMap(result);
    }

    public synchronized Map<String, V> snapshot() {
        List<Map.Entry<String, V>> entries = new ArrayList<>();
        traverse(root, entries);
        LinkedHashMap<String, V> result = new LinkedHashMap<>();
        entries.forEach(entry -> result.put(entry.getKey(), entry.getValue()));
        return Collections.unmodifiableMap(result);
    }

    public synchronized int size() { return size; }

    private static <V> V search(Node<V> node, String key) {
        int i = 0;
        while (i < node.keys.size() && key.compareTo(node.keys.get(i)) > 0) i++;
        if (i < node.keys.size() && key.equals(node.keys.get(i))) return node.values.get(i);
        return node.leaf ? null : search(node.children.get(i), key);
    }

    private static <V> boolean replace(Node<V> node, String key, V value) {
        int i = 0;
        while (i < node.keys.size() && key.compareTo(node.keys.get(i)) > 0) i++;
        if (i < node.keys.size() && key.equals(node.keys.get(i))) {
            node.values.set(i, value);
            return true;
        }
        return !node.leaf && replace(node.children.get(i), key, value);
    }

    private static <V> void insertNonFull(Node<V> node, String key, V value) {
        int i = node.keys.size() - 1;
        if (node.leaf) {
            while (i >= 0 && key.compareTo(node.keys.get(i)) < 0) i--;
            node.keys.add(i + 1, key);
            node.values.add(i + 1, value);
            return;
        }
        while (i >= 0 && key.compareTo(node.keys.get(i)) < 0) i--;
        i++;
        if (node.children.get(i).keys.size() == 2 * DEGREE - 1) {
            splitChild(node, i);
            if (key.compareTo(node.keys.get(i)) > 0) i++;
        }
        insertNonFull(node.children.get(i), key, value);
    }

    private static <V> void splitChild(Node<V> parent, int position) {
        Node<V> full = parent.children.get(position);
        Node<V> right = new Node<>(full.leaf);
        String middleKey = full.keys.get(DEGREE - 1);
        V middleValue = full.values.get(DEGREE - 1);
        for (int j = DEGREE; j < 2 * DEGREE - 1; j++) {
            right.keys.add(full.keys.get(j));
            right.values.add(full.values.get(j));
        }
        if (!full.leaf) {
            for (int j = DEGREE; j < 2 * DEGREE; j++) right.children.add(full.children.get(j));
        }
        full.keys.subList(DEGREE - 1, full.keys.size()).clear();
        full.values.subList(DEGREE - 1, full.values.size()).clear();
        if (!full.leaf) full.children.subList(DEGREE, full.children.size()).clear();
        parent.keys.add(position, middleKey);
        parent.values.add(position, middleValue);
        parent.children.add(position + 1, right);
    }

    private static <V> void traverse(Node<V> node, List<Map.Entry<String, V>> out) {
        for (int i = 0; i < node.keys.size(); i++) {
            if (!node.leaf) traverse(node.children.get(i), out);
            out.add(Map.entry(node.keys.get(i), node.values.get(i)));
        }
        if (!node.leaf) traverse(node.children.get(node.keys.size()), out);
    }

    private static <V> void range(Node<V> node, String first, String last, Map<String, V> out) {
        for (int i = 0; i < node.keys.size(); i++) {
            if (!node.leaf && first.compareTo(node.keys.get(i)) <= 0) range(node.children.get(i), first, last, out);
            String key = node.keys.get(i);
            if (key.compareTo(first) >= 0 && key.compareTo(last) <= 0) out.put(key, node.values.get(i));
            if (key.compareTo(last) > 0) return;
        }
        if (!node.leaf && (node.keys.isEmpty() || last.compareTo(node.keys.get(node.keys.size() - 1)) >= 0)) {
            range(node.children.get(node.keys.size()), first, last, out);
        }
    }

    private static final class Node<V> {
        private final boolean leaf;
        private final List<String> keys = new ArrayList<>();
        private final List<V> values = new ArrayList<>();
        private final List<Node<V>> children = new ArrayList<>();
        private Node(boolean leaf) { this.leaf = leaf; }
    }
}
