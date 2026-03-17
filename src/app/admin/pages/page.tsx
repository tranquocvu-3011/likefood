"use client";

/**
 * LIKEFOOD - Admin Dynamic Pages Management
 * Manage About, FAQ, Policies, and custom pages
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Plus, Pencil, Trash2, Loader2, Save, X, 
  Eye, EyeOff, ChevronUp, ChevronDown, Settings, Copy, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DynamicPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  image: string | null;
  template: string;
  type: string;
  isPublished: boolean;
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const PAGE_TYPES = [
  { value: "about", label: "Giới thiệu", icon: "ℹ️" },
  { value: "faq", label: "FAQ - Câu hỏi thường gặp", icon: "❓" },
  { value: "policy", label: "Chính sách", icon: "📋" },
  { value: "contact", label: "Liên hệ", icon: "📞" },
  { value: "custom", label: "Trang tùy chỉnh", icon: "📄" },
];

const PAGE_TEMPLATES = [
  { value: "default", label: "Mặc định" },
  { value: "full-width", label: "Toàn chiều rộng" },
  { value: "sidebar", label: "Có thanh bên" },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<DynamicPage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    image: "",
    template: "default",
    type: "custom",
    isPublished: true,
    isDefault: false,
    order: 0,
  });

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch {
      toast.error("Không thể tải trang");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleAddPage = async () => {
    if (!newPage.title || !newPage.slug) {
      toast.error("Tiêu đề và slug là bắt buộc");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage),
      });

      if (res.ok) {
        toast.success("Đã thêm trang");
        setShowAddDialog(false);
        setNewPage({
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          metaTitle: "",
          metaDescription: "",
          image: "",
          template: "default",
          type: "custom",
          isPublished: true,
          isDefault: false,
          order: 0,
        });
        fetchPages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi thêm");
      }
    } catch {
      toast.error("Lỗi khi thêm trang");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPage),
      });

      if (res.ok) {
        toast.success("Đã cập nhật trang");
        setShowEditDialog(false);
        setEditingPage(null);
        fetchPages();
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

  const handleDeletePage = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa trang này?")) return;

    try {
      const res = await fetch(`/api/admin/pages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Đã xóa trang");
        fetchPages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi khi xóa");
      }
    } catch {
      toast.error("Lỗi khi xóa");
    }
  };

  const handleTogglePublish = async (page: DynamicPage) => {
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: page.id,
          isPublished: !page.isPublished,
        }),
      });

      if (res.ok) {
        fetchPages();
      }
    } catch {
      toast.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const handleDuplicate = (page: DynamicPage) => {
    setNewPage({
      title: `${page.title} (Copy)`,
      slug: `${page.slug}-copy`,
      content: page.content,
      excerpt: page.excerpt || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      image: page.image || "",
      template: page.template,
      type: page.type,
      isPublished: false,
      isDefault: false,
      order: 0,
    });
    setShowAddDialog(true);
  };

  const handlePreview = (page: DynamicPage) => {
    setPreviewContent(page.content);
    setShowPreview(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const movePage = (index: number, direction: "up" | "down") => {
    const newPages = [...pages];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPages.length) return;
    
    [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
    newPages[index].order = index;
    newPages[newIndex].order = newIndex;
    setPages(newPages);
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
            <h1 className="text-2xl font-bold text-zinc-100">Quản lý Trang</h1>
            <p className="text-zinc-400">Tạo và chỉnh sửa các trang nội dung (About, FAQ, Policies...)</p>
        </div>
          <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm trang mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const typeInfo = PAGE_TYPES.find(t => t.value === page.type);
          return (
            <Card key={page.id} className="border-zinc-700/50 bg-[#111113] hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-3 border-b border-zinc-700/50">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-zinc-100">
                    {typeInfo?.icon || "📄"} {page.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {page.isPublished ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                       <EyeOff className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-sm text-zinc-400 mb-2">/{page.slug}</p>
                {page.excerpt && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{page.excerpt}</p>
                )}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded">
                    {typeInfo?.label || page.type}
                  </span>
                  <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded">
                    {PAGE_TEMPLATES.find(t => t.value === page.template)?.label || page.template}
                  </span>
                  {page.isDefault && (
                    <span className="text-xs px-2 py-1 bg-teal-900/40 text-teal-400 rounded">
                      Mặc định
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => handlePreview(page)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => {
                      setEditingPage(page);
                      setShowEditDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => handleDuplicate(page)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                      className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-800"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {pages.length === 0 && (
          <div className="col-span-full">
            <Card className="border-zinc-700/50 bg-[#111113]">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-zinc-500 mb-4" />
                  <p className="text-zinc-500 mb-4">Chưa có trang nào</p>
                  <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo trang đầu tiên
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Tạo trang mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Tiêu đề *</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={newPage.title}
                  onChange={(e) => {
                    setNewPage({ 
                      ...newPage, 
                      title: e.target.value,
                      slug: newPage.slug ? newPage.slug : generateSlug(e.target.value)
                    });
                  }}
                  placeholder="Giới thiệu"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Slug *</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: generateSlug(e.target.value) })}
                  placeholder="gioi-thieu"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Loại trang</Label>
                <select
                  className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                  value={newPage.type}
                  onChange={(e) => setNewPage({ ...newPage, type: e.target.value })}
                >
                  {PAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-zinc-400">Giao diện</Label>
                <select
                  className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                  value={newPage.template}
                  onChange={(e) => setNewPage({ ...newPage, template: e.target.value })}
                >
                  {PAGE_TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">Tóm tắt</Label>
              <Textarea
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                value={newPage.excerpt}
                onChange={(e) => setNewPage({ ...newPage, excerpt: e.target.value })}
                placeholder="Mô tả ngắn về trang..."
                rows={2}
              />
            </div>
            <div>
              <Label className="text-zinc-400">Nội dung</Label>
              <Textarea
                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50 font-mono text-sm"
                value={newPage.content}
                onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                placeholder="Nội dung trang (hỗ trợ HTML)..."
                rows={10}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Meta Title</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={newPage.metaTitle}
                  onChange={(e) => setNewPage({ ...newPage, metaTitle: e.target.value })}
                  placeholder="SEO Title"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Meta Description</Label>
                <Input
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={newPage.metaDescription}
                  onChange={(e) => setNewPage({ ...newPage, metaDescription: e.target.value })}
                  placeholder="SEO Description"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newPublished"
                  checked={newPage.isPublished}
                  onChange={(e) => setNewPage({ ...newPage, isPublished: e.target.checked })}
                    className="rounded accent-teal-500"
                />
                <Label htmlFor="newPublished" className="cursor-pointer text-zinc-300">Xuất bản</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newDefault"
                  checked={newPage.isDefault}
                  onChange={(e) => setNewPage({ ...newPage, isDefault: e.target.checked })}
                    className="rounded accent-teal-500"
                />
                <Label htmlFor="newDefault" className="cursor-pointer text-zinc-300">Làm trang mặc định</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleAddPage} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Tạo trang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Chỉnh sửa trang</DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">Tiêu đề *</Label>
                  <Input
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Slug *</Label>
                  <Input
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: generateSlug(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">Loại trang</Label>
                  <select
                    className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                    value={editingPage.type}
                    onChange={(e) => setEditingPage({ ...editingPage, type: e.target.value })}
                  >
                    {PAGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-zinc-400">Giao diện</Label>
                  <select
                    className="w-full h-10 px-3 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg"
                    value={editingPage.template}
                    onChange={(e) => setEditingPage({ ...editingPage, template: e.target.value })}
                  >
                    {PAGE_TEMPLATES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400">Tóm tắt</Label>
                <Textarea
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                  value={editingPage.excerpt || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-zinc-400">Nội dung</Label>
                <Textarea
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50 font-mono text-sm"
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  rows={15}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">Meta Title</Label>
                  <Input
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                    value={editingPage.metaTitle || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, metaTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Meta Description</Label>
                  <Input
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500/50"
                    value={editingPage.metaDescription || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editPublished"
                    checked={editingPage.isPublished}
                    onChange={(e) => setEditingPage({ ...editingPage, isPublished: e.target.checked })}
                      className="rounded accent-teal-500"
                  />
                  <Label htmlFor="editPublished" className="cursor-pointer text-zinc-300">Xuất bản</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editDefault"
                    checked={editingPage.isDefault}
                    onChange={(e) => setEditingPage({ ...editingPage, isDefault: e.target.checked })}
                      className="rounded accent-teal-500"
                  />
                  <Label htmlFor="editDefault" className="cursor-pointer text-zinc-300">Làm trang mặc định</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white" onClick={handleUpdatePage} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111113] border-zinc-700/50 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Xem trước nội dung</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none p-6 bg-zinc-900 rounded-lg border border-zinc-700/50"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }}
          />
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setShowPreview(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
