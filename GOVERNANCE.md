# 🏛️ Quản Trị Dự Án — LIKEFOOD

## Cấu Trúc Quản Trị

### Maintainer

| Vai trò | Người | Liên hệ |
|---------|-------|---------|
| **Project Owner & Lead Developer** | Trần Quốc Vũ | tranquocvu3011@gmail.com |

### Trách nhiệm Maintainer

- Review và merge Pull Requests
- Quản lý releases và versioning
- Quyết định hướng phát triển kỹ thuật
- Quản lý Issues và bug tracking
- Đảm bảo chất lượng code và test coverage

---

## Quy Trình Ra Quyết Định

### Thay đổi nhỏ (Minor)
- Bug fixes, typos, dependency updates
- Maintainer tự quyết định và merge

### Thay đổi lớn (Major)
- Tính năng mới, breaking changes, architecture changes
- Tạo RFC Issue để thảo luận
- Thu thập feedback từ community
- Maintainer quyết định cuối cùng

### Breaking Changes
- Thông báo trước ít nhất 1 phiên bản
- Ghi rõ trong CHANGELOG.md
- Cung cấp migration guide

---

## Release Process

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes
```

### Quy trình release

1. Cập nhật CHANGELOG.md
2. Bump version trong package.json
3. Tạo Git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. GitHub Actions tự động tạo Release
6. Deploy lên production

### Release Schedule

- **Patch releases**: Khi cần thiết (hotfix)
- **Minor releases**: Hàng tháng
- **Major releases**: Hàng quý hoặc khi có breaking changes

---

## Communication Channels

| Kênh | Mục đích |
|------|----------|
| **GitHub Issues** | Bug reports, feature requests |
| **GitHub Discussions** | Thảo luận chung, Q&A |
| **Email** | Liên hệ trực tiếp maintainer |

---

## Code of Conduct

Dự án tuân theo [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Mọi người tham gia đều phải tuân thủ.

---

## License

Dự án sử dụng [MIT License](LICENSE). Xem file LICENSE để biết chi tiết.
