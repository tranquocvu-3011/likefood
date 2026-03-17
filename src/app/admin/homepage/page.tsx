"use client";

/**
 * LIKEFOOD - Admin Homepage Sections Management
 * Manage homepage sections (hero, featured products, etc.)
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Layout, Plus, Pencil, Trash2, Loader2, Save, X, 
  GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Settings
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface HomepageSection {
  id: number;
  key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  config: unknown;
  type: string;
  isActive: boolean;
  position: number;
  limit: number;
  startAt: string | null;
  endAt: string | null;
}

const SECTION_TYPES = [
  { value: "hero", label: "Hero Banner", description: "Banner lớn đầu trang" },
  { value: "carousel", label: "Carousel", description: "Banner chạy ngang" },
  { value: "flash-sale", label: "Flash Sale", description: "Section giảm giá sốc" },
  { value: "featured-products", label: "Sản phẩm nổi bật", description: "Danh sách sản phẩm nổi bật" },
  { value: "categories", label: "Danh mục", description: "Hiển thị danh mục sản phẩm" },
  { value: "grid", label: "Lưới sản phẩm", description: "Lưới sản phẩm thường" },
  { value: "list", label: "Danh sách", description: "Danh sách sản phẩm" },
  { value: "banner", label: "Banner", description: "Banner quảng cáo" },
  { value: "testimonials", label: "Đánh giá khách hàng", description: "Testimonials" },
];

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [newSection, setNewSection] = useState({
    key: "",
    title: "",
    subtitle: "",
    description: "",
    type: "grid",
    isActive: true,
    position: 0,
    limit: 10,
    startAt: "",
    endAt: "",
  });

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/homepage-sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch {
      toast.error("Không thể tải sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: sections }),
      });

      if (res.ok) {
        toast.success("Đã lưu thứ tự");
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi lưu");
      }
    } catch {
      toast.error("Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSection.key || !newSection.type) {
      toast.error("Key và loại section là bắt buộc");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSection),
      });

      if (res.ok) {
        toast.success("Đã thêm section");
        setShowAddDialog(false);
        setNewSection({
          key: "",
          title: "",
          subtitle: "",
          description: "",
          type: "grid",
          isActive: true,
          position: 0,
          limit: 10,
          startAt: "",
          endAt: "",
        });
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi thêm");
      }
    } catch {
      toast.error("Lỗi khi thêm section");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: editingSection.id,
            title: editingSection.title,
            subtitle: editingSection.subtitle,
            description: editingSection.description,
            isActive: editingSection.isActive,
            limit: editingSection.limit,
          }],
        }),
      });

      if (res.ok) {
        toast.success("Đã cập nhật section");
        setShowEditDialog(false);
        setEditingSection(null);
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi cập nhật");
      }
    } catch {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa section này?")) return;

    try {
      const res = await fetch(`/api/admin/homepage-sections?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Đã xóa section");
        fetchSections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi xóa");
      }
    } catch {
      toast.error("Lỗi khi xóa");
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSections.length) return;
    
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    newSections[index].position = index;
    newSections[newIndex].position = newIndex;
    setSections(newSections);
  };

  const toggleActive = async (section: HomepageSection) => {
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: section.id,
            isActive: !section.isActive,
          }],
        }),
      });

      if (res.ok) {
        fetchSections();
      }
    } catch {
      toast.error("Lỗi khi thay đổi trạng thái");
    }
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
          <h1 className="text-2xl font-bold text-zinc-100">Quản lý Homepage</h1>
          <p className="text-zinc-400">Cấu hình các section trên trang chủ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100" onClick={handleSaveOrder} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thứ tự
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm section
          </Button>
        </div>
      </div>

      <Card className="border-zinc-700/50 bg-[#111113]">
        <CardHeader className="border-b border-zinc-700/50">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Layout className="h-5 w-5 text-teal-400" />
            Các Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có section nào</p>
              <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm section đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => {
                const typeInfo = SECTION_TYPES.find(t => t.value === section.type);
                return (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-700/50 rounded-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                        onClick={() => moveSection(index, "down")}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <GripVertical className="h-5 w-5 text-zinc-500 cursor-grab" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-100">{section.title || section.key}</span>
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                          {typeInfo?.label || section.type}
                        </span>
                      </div>
                      {section.subtitle && (
                        <p className="text-sm text-zinc-400 truncate">{section.subtitle}</p>
                      )}
                      <p className="text-xs text-zinc-500">Key: {section.key}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Limit: {section.limit}</span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-zinc-800"
                        onClick={() => toggleActive(section)}
                        title={section.isActive ? "Ẩn" : "Hiển thị"}
                      >
                        {section.isActive ? (
                          <Eye className="h-4 w-4 text-teal-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-zinc-500" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => {
                          setEditingSection(section);
                          setShowEditDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-800"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Thêm Section mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-zinc-400">Key *</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newSection.key}
                onChange={(e) => setNewSection({ ...newSection, key: e.target.value })}
                placeholder="hero, featured-products, flash-sale..."
              />
              <p className="text-xs text-zinc-500 mt-1">Định danh duy nhất cho section</p>
            </div>
            <div>
              <Label className="text-zinc-400">Loại Section *</Label>
              <select
                className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                value={newSection.type}
                onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-zinc-400">Tiêu đề</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                placeholder="Sản phẩm nổi bật"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Phụ đề</Label>
              <Input
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newSection.subtitle}
                onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
                placeholder="Những sản phẩm được yêu thích nhất"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Mô tả</Label>
              <Textarea
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newSection.description}
                onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                placeholder="Mô tả ngắn..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Vị trí</Label>
                <Input
                  type="number"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-teal-500/50"
                  value={newSection.position}
                  onChange={(e) => setNewSection({ ...newSection, position: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-zinc-400">Số lượng hiển thị</Label>
                <Input
                  type="number"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-teal-500/50"
                  value={newSection.limit}
                  onChange={(e) => setNewSection({ ...newSection, limit: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newActive"
                checked={newSection.isActive}
                onChange={(e) => setNewSection({ ...newSection, isActive: e.target.checked })}
                className="rounded accent-teal-500"
              />
              <Label htmlFor="newActive" className="cursor-pointer text-zinc-300">Hiển thị ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleAddSection} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Chỉnh sửa Section</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label className="text-zinc-400">Key</Label>
                <Input value={editingSection.key} disabled className="bg-zinc-800 text-zinc-500 border-zinc-700" />
              </div>
              <div>
                <Label className="text-zinc-400">Tiêu đề</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={editingSection.title || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-zinc-400">Phụ đề</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={editingSection.subtitle || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-zinc-400">Mô tả</Label>
                <Textarea
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={editingSection.description || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-zinc-400">Số lượng hiển thị</Label>
                <Input
                  type="number"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-teal-500/50"
                  value={editingSection.limit}
                  onChange={(e) => setEditingSection({ ...editingSection, limit: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editingSection.isActive}
                  onChange={(e) => setEditingSection({ ...editingSection, isActive: e.target.checked })}
                  className="rounded accent-teal-500"
                />
                <Label htmlFor="editActive" className="cursor-pointer text-zinc-300">Hiển thị</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleUpdateSection} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
