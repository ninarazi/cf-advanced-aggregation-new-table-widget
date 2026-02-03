# cplace NextGen Platform - Advanced Table Aggregator

## Overview
This application is a high-fidelity, interactive table widget built for the **cplace NextGen Platform**. It focuses on advanced data manipulation, multi-level grouping, and real-time ad-hoc aggregations (math calculations) based on user selection.

## Tech Stack
- **Framework:** React 19 (ESM via esm.sh)
- **Styling:** Tailwind CSS
- **Icons:** Lucide-React + Custom Brand SVGs
- **Font:** Roboto Condensed (Weights 100-900)
- **Data:** TypeScript-defined mock data structures

## Core Features

### 1. Multi-Level Grouping
- Users can group data by any column via the column header menu.
- Supports nested grouping (e.g., Group by Manager -> then by Country).
- Active groups are displayed in a "Grouping Area" toolbar with sort toggles and "Expand/Collapse All" functionality.

### 2. Interaction & Selection
- **Cell Selection:** Clicking numeric cells or the "Name" column selects them. Selected cells feature a #0078BD border and #E6F2F9 background.
- **Row Selection:** Standard checkboxes for single rows, group-level selection (selects all children), and a master checkbox in the header.
- **Selection Persistence:** Clicking anywhere outside the table widget automatically clears all active cell and row selections.

### 3. Real-Time Ad-Hoc Math (Math Bar)
- When numeric cells are selected, a floating dark footer (Math Bar) appears.
- It calculates **Sum, Average, Min, Max, and Count** for the selected values.
- **Unit Logic:** If selected cells have mismatched units (e.g., years vs percent), math calculations are disabled, and a warning is shown.
- **Configuration:** Users can toggle which aggregation functions are visible via a Sigma (Σ) menu.

### 4. Group Totals
- When a group is expanded, a "Total" row is rendered at the bottom of that group's child list.
- These rows show the sum of numeric columns for that specific group, styled with italic labels and blue bold text.

### 5. Workspace Navigation (Sidebar)
- A vertical sidebar on the left provides quick navigation.
- Includes the cplace menu button and custom-styled brand icons:
  - **Coffee Icon:** Background #00A3FF
  - **Location/Pin Icon:** Background #005E94

### 6. Column Management
- **Resizing:** Columns can be manually resized via a handle on the right edge of headers.
- **Context Menus:** Each column has a "More" (Vertical Dots) menu offering:
  - Filtering
  - Ascending/Descending Sort
  - Pinning
  - Grouping/Ungrouping
  - Column reset

## Design System & UX
- **Color Palette:**
  - Primary Blue: `#0078BD`
  - Selected Cell BG: `#E6F2F9`
  - Header Gray: `#5f6b7d`
  - Sidebar Secondary: `#00A3FF` & `#005E94`
- **Density:** The "Compact" layout uses a 34px row height for high data density.
- **Typography:** Uses "Roboto Condensed" throughout to maintain a professional, technical aesthetic.

## File Structure
- `App.tsx`: Main component housing state for grouping, expansion, selection, and sorting.
- `types.ts`: TypeScript definitions for the `TableRow`, `TableNode` tree structure, and `AggregationFunction`.
- `data/mock.ts`: Generates 100+ rows of realistic business data.
- `index.html`: Contains global CSS for the custom selection ring and scrollbar styling.
- `utils/aggregations.ts`: Pure functions for computing math stats.

## Usage for AI Tools
When modifying this app, ensure that:
1. The **Selection Ring** always uses `border: 2px solid #0078BD`.
2. New features respect the **compact row height (34px)**.
3. Interactive elements provide **visual feedback** (hovers, active states).
4. All logic for tree flattening and grouping remains performant for 1000+ rows.
