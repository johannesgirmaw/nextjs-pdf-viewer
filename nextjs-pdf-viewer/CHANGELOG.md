# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of AI PDF Viewer
- Web component `<pdf-viewer>` with full functionality
- Programmatic API with `PdfViewer` class
- Smooth virtualized rendering using IntersectionObserver
- Zoom-proof text highlighting (50%–300%+)
- Full-text search across all pages with live result count
- Modern UI with grouped controls and zoom dropdown
- Keyboard shortcuts support
- Document-level scrolling option
- TypeScript support with full type definitions
- ESM/CJS builds for maximum compatibility
- Zero dependencies (except pdfjs-dist)
- Framework agnostic design

### Technical Details
- Built on PDF.js v4.6.82
- Uses canvas rendering for optimal performance
- IntersectionObserver-based virtualization
- Character-level precision highlighting
- Support for all modern browsers with ES2020+

## [0.1.0] - 2025-01-27

### Added
- Initial release
- Core PDF viewing functionality
- Search and highlighting features
- Web component implementation
- TypeScript definitions
- MIT license

---

## Version History

- **0.1.0** - Initial release with core functionality

## Planned Features

- [ ] Text layer support for better accessibility
- [ ] Annotation support
- [ ] Print functionality
- [ ] More customization options
- [ ] React/Vue/Angular specific examples
- [ ] Unit tests
- [ ] Performance optimizations
- [ ] Mobile-specific improvements
- [ ] Dark mode support
- [ ] Custom themes

## Migration Guide

### From 0.1.0 to future versions

No breaking changes planned for the immediate future. The API is designed to be stable and backward-compatible.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
