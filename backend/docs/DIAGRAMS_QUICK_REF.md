# Backend Diagrams - Quick Reference

> **TIP**: Open `.puml` files in VS Code with PlantUML extension or paste them at http://www.plantuml.com/plantuml/uml/ to view diagrams.

## 📊 Available Diagrams

### 🏗️ Architecture & Structure

| Diagram | File | Lines | Use When |
|---------|------|-------|----------|
| **System Architecture** | `system-architecture-diagram.puml` | 162 | Understanding overall system design |
| **UML Class Diagram** | `uml-class-diagram.puml` | 391 | Learning code structure & relationships |
| **Database ERD** | `database-erd-diagram.puml` | 259 | Working with database queries |

### 🔄 Business Workflows

| Diagram | File | Lines | Use When |
|---------|------|-------|----------|
| **Authentication** | `activity-diagram-authentication.puml` | 65 | Implementing login/register |
| **Ticket Booking** | `activity-diagram-ticket-booking.puml` | 113 | Understanding booking logic |
| **Payment Processing** | `activity-diagram-payment-processing.puml` | 168 | Integrating payment gateway |
| **Booking Cleanup** | `activity-diagram-booking-cleanup.puml` | 181 | Working with background jobs |
| **Train Search** | `activity-diagram-train-search.puml` | 161 | Implementing search & availability |

## 🎯 Common Use Cases

### "I need to understand how authentication works"
→ `activity-diagram-authentication.puml`

### "I'm working on the database schema"
→ `database-erd-diagram.puml`

### "I need to implement seat booking"
→ `activity-diagram-ticket-booking.puml` + `database-erd-diagram.puml`

### "I'm debugging payment issues"
→ `activity-diagram-payment-processing.puml`

### "I want to see the overall system design"
→ `system-architecture-diagram.puml`

### "I need to understand all the models"
→ `uml-class-diagram.puml`

### "I'm implementing search functionality"
→ `activity-diagram-train-search.puml`

### "I need to understand background jobs"
→ `activity-diagram-booking-cleanup.puml`

## 🚀 Quick View

**Online (No Installation):**
1. Copy any `.puml` file content
2. Go to http://www.plantuml.com/plantuml/uml/
3. Paste and view

**VS Code:**
1. Install PlantUML extension
2. Open `.puml` file
3. Press `Alt+D` to preview

**Generate Images:**
```bash
# Download PlantUML JAR
wget https://github.com/plantuml/plantuml/releases/download/v1.2024.7/plantuml-1.2024.7.jar

# Generate all diagrams as PNG
cd backend/docs
java -jar plantuml-1.2024.7.jar -tpng *.puml
```

## 📚 Full Documentation

See [DIAGRAMS.md](./DIAGRAMS.md) for complete documentation including:
- Detailed diagram explanations
- Viewing instructions for all platforms
- Notation guide
- Maintenance guidelines

## 🔄 Diagram Maintenance

**When to update diagrams:**
- ✅ New database models added
- ✅ API endpoints changed
- ✅ Business logic modified
- ✅ Payment flow updated
- ✅ Service architecture changed

**How to update:**
1. Edit the `.puml` file
2. Test rendering (online or locally)
3. Update documentation if needed
4. Commit changes

## 💡 Tips

- Diagrams are in **PlantUML text format** - they're version-control friendly
- PNG/SVG outputs are **gitignored** - regenerate as needed
- Each diagram is **self-contained** - no dependencies
- Use **online editor** for quick viewing without installation
- **VS Code extension** provides real-time preview while editing

---

**Need help?** See [DIAGRAMS.md](./DIAGRAMS.md) for comprehensive documentation.
