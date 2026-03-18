"use client";

/**
 * LIKEFOOD - Admin Menu Management Page
 * Manage navigation menu items
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Menu, Plus, Pencil, Trash2, Loader2, Save, GripVertical, Eye, EyeOff, ChevronRight, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from "@/components/ui/dialog";

interface MenuItem {
  id: number;
  name: string;
  slug: string;
  type: string;
  url: string | null;
  categoryId: string | null;
  productId: number | null;
  pageId: string | null;
  icon: string | null;
  parentId: string | null;
  position: number;
  isVisible: boolean;
  isActive: boolean;
  children?: MenuItem[];
}

const MENU_TYPES = [
  { value: "LINK", label: "Liên kết nội bộ", icon: "🔗" },
  { value: "CATEGORY", label: "Danh mục sản phẩm", icon: "📁" },
  { value: "PRODUCT", label: "Sản phẩm", icon: "📦" },
  { value: "PAGE", label: "Trang động", icon: "📄" },
  { value: "EXTERNAL", label: "Liên kết ngoài", icon: "🌐" },
];

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [newItem, setNewItem] = useState({
    name: "",
    slug: "",
    type: "LINK",
    url: "",
    icon: "",
    parentId: "" as string | null,
    position: 0,
    isVisible: true,
  });

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch {
      toast.error("Không thể tải menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: menuItems }),
      });

      if (res.ok) {
        toast.success("Đã lưu thứ tự menu");
        fetchMenuItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi lưu");
      }
    } catch {
      toast.error("Lỗi khi lưu menu");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenu = async () => {
    if (!newItem.name) {
      toast.error("Tên menu là bắt buộc");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        toast.success("Đã thêm menu");
        setShowAddDialog(false);
        setNewItem({
          name: "",
          slug: "",
          type: "LINK",
          url: "",
          icon: "",
          parentId: null,
          position: 0,
          isVisible: true,
        });
        fetchMenuItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi thêm menu");
      }
    } catch {
      toast.error("Lỗi khi thêm menu");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: editingItem.id,
            name: editingItem.name,
            url: editingItem.url,
            isVisible: editingItem.isVisible,
            isActive: editingItem.isActive,
          }],
        }),
      });

      if (res.ok) {
        toast.success("Đã cập nhật menu");
        setShowEditDialog(false);
        setEditingItem(null);
        fetchMenuItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi cập nhật");
      }
    } catch {
      toast.error("Lỗi khi cập nhật menu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa menu này?")) return;

    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Đã xóa menu");
        fetchMenuItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi xóa");
      }
    } catch {
      toast.error("Lỗi khi xóa menu");
    }
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(String(id))) {
      newExpanded.delete(String(id));
    } else {
      newExpanded.add(String(id));
    }
    setExpandedItems(newExpanded);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...menuItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    newItems[index].position = index;
    newItems[newIndex].position = newIndex;
    setMenuItems(newItems);
  };

  const renderMenuItem = (item: MenuItem, index: number, isChild = false) => {
    const typeLabel = MENU_TYPES.find(t => t.value === item.type)?.label || item.type;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(String(item.id));

    return (
      <div
        key={item.id}
        className={`${isChild ? "ml-8 border-l-2 border-zinc-700 pl-4" : ""} mb-2`}
      >
        <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-700/50 rounded-lg hover:border-zinc-700 transition-colors">
          {!isChild && (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => moveItem(index, "up")}
                disabled={index === 0}
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => moveItem(index, "down")}
                disabled={index === menuItems.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          <GripVertical className="h-5 w-5 text-zinc-500 cursor-grab" />

          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-100">{item.name}</span>
              <span className="text-xs text-zinc-500">({typeLabel})</span>
              {item.url && (
                <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                  → {item.url}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.isVisible ? (
              <Eye className="h-4 w-4 text-teal-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-zinc-500" />
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setEditingItem(item);
                setShowEditDialog(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-800"
              onClick={() => handleDeleteMenu(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {item.children!.map((child, childIndex) => 
              renderMenuItem(child, childIndex, true)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Quản lý Menu</h1>
          <p className="text-zinc-400">Sắp xếp và quản lý menu điều hướng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100" onClick={handleSaveOrder} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thứ tự
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm menu
          </Button>
        </div>
      </div>

      <Card className="border-zinc-700/50 bg-[#111113]">
        <CardHeader className="border-b border-zinc-700/50">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Menu className="h-5 w-5 text-teal-400" />
            Cấu trúc Menu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Menu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có menu nào</p>
              <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm menu đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {menuItems.map((item, index) => renderMenuItem(item, index))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Thêm menu mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Tên menu *</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ví dụ: Sản phẩm"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Slug</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newItem.slug}
                onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                placeholder="Để trống sẽ tự tạo"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Loại menu *</Label>
              <select
                className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
              >
                {MENU_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            {(newItem.type === "LINK" || newItem.type === "EXTERNAL") && (
              <div>
                <Label className="text-zinc-400">URL</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder={newItem.type === "EXTERNAL" ? "https://..." : "/products"}
                />
              </div>
            )}
            <div>
              <Label className="text-zinc-400">Icon (class name)</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newItem.icon}
                onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                placeholder="Ví dụ: Lucide icon name"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={newItem.isVisible}
                onChange={(e) => setNewItem({ ...newItem, isVisible: e.target.checked })}
                className="rounded accent-teal-500"
              />
              <Label htmlFor="isVisible" className="cursor-pointer text-zinc-300">Hiển thị menu</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleAddMenu} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Chỉnh sửa menu</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400">Tên menu *</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              {(editingItem.type === "LINK" || editingItem.type === "EXTERNAL") && (
                <div>
                  <Label className="text-zinc-400">URL</Label>
                  <Input
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                    value={editingItem.url || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editVisible"
                    checked={editingItem.isVisible}
                    onChange={(e) => setEditingItem({ ...editingItem, isVisible: e.target.checked })}
                    className="rounded accent-teal-500"
                  />
                  <Label htmlFor="editVisible" className="cursor-pointer text-zinc-300">Hiển thị</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="rounded accent-teal-500"
                  />
                  <Label htmlFor="editActive" className="cursor-pointer text-zinc-300">Hoạt động</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleUpdateMenu} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
