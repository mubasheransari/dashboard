# Mezan Tea — Next.js Daily & Monthly Sales Dashboard

A responsive Next.js dashboard designed around the `Dashboard.xlsx` workbook. It includes daily sales trends, monthly comparison, KPI cards, regional sales ranking, a daily records table, and manual refresh. It uses the Mezan Tea look (red and white).

## What is included

- Next.js App Router + TypeScript
- Recharts visualizations
- Responsive desktop/tablet/mobile layout, single-page (no sidebar)
- Theme colors live as CSS variables at the top of `app/globals.css`; chart colors are in the `C` object at the top of `components/dashboard.tsx`
- Optional logo: put a file in `public/` and set `LOGO_SRC` in `components/dashboard.tsx`
- `/api/dashboard` server-side route
- Sample data extracted from the workbook's **TOTAL primary sales** row, so the UI works before connecting Google Sheets
- Optional private Google Sheets integration (credentials stay server-side)

> The sample dataset contains the daily values available in the uploaded workbook through 13 October 2026. Validate the business definitions and units with the spreadsheet owner before treating dashboard figures as official. October MTD comes from the workbook's TOTAL row, not the GRAND TOTAL row, to keep primary sales separate from export values.

## 1. Run locally

Install Node.js 20 or later, unzip the project, and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Google credentials configured, it uses `lib/sample-data.json`.

## 2. Prepare Google Sheets

For the easiest and safest integration, create a Google spreadsheet for dashboard data with these three tabs and exact names. Use ISO dates (`YYYY-MM-DD`) and numeric sales values, without thousands separators.

### Tab: `Daily Sales`

| date | sales |
|---|---:|
| 2026-10-01 | 0 |
| 2026-10-02 | 1223 |

Use one row per date. Paste the daily values from your workbook's **TOTAL** row (not `GRAND TOTAL`, if you want primary sales excluding exports).

### Tab: `Monthly Sales`

| month | label | sales |
|---|---|---:|
| 2026-07 | July 2026 | 98654 |
| 2026-08 | August 2026 | 94475 |
| 2026-09 | September 2026 | 103473 |
| 2026-10 | October 2026 (MTD) | 21785 |

Keep month in `YYYY-MM` format. Replace the example figures with the exact source values; these rows illustrate the expected structure.

### Tab: `Regional Sales`

| region | sales |
|---|---:|
| Karachi | 2767 |
| Hyderabad | 1414 |

Use each region's current reporting-period total. Add the remaining regions as rows.

The first row in each tab must be the header. Data starts from row 2. The current code reads the following ranges: `Daily Sales!A2:B`, `Monthly Sales!A2:C`, and `Regional Sales!A2:B`.

### Keep the spreadsheet private

1. In Google Cloud Console, create/select a project and enable **Google Sheets API**.
2. Create a service account and a JSON key. Keep the JSON key private.
3. Copy the service account email and share the Google spreadsheet with that email as **Viewer**. Do not turn on “Anyone with the link”.
4. Copy the spreadsheet ID from the Google Sheets URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.

This is a read-only connection. Next.js reads the sheet from a server-side route; the browser never receives the service-account private key.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and set:

```env
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
```

For `GOOGLE_PRIVATE_KEY`, use the `private_key` field from the service-account JSON. Keep the newlines as `\n` if entering it on one line. Never commit `.env.local` or share the key in chat. Restart `npm run dev` after changing environment variables.

If the environment variables are absent, the app uses sample data. If Sheets is temporarily unavailable, the API also falls back to sample data; check the source label in the UI to know which data is being shown.

## 4. Deploy to Vercel

1. Push the project to a private GitHub repository.
2. Import that repository in Vercel.
3. Add `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` in **Project Settings → Environment Variables** for the appropriate environment.
4. Deploy. Your site will be available on a `*.vercel.app` address unless you attach a custom domain.
5. Redeploy after changing environment variables.

Vercel's free Hobby plan is generally intended for personal, non-commercial use. For an internal company dashboard, check current Vercel plan terms and your company's IT/security policy before deploying company sales data.

## 5. Updating data

Update the three Google Sheets tabs and click **Refresh data** in the dashboard. The API disables caching for the response, so it fetches current sheet values on each request. For automatic polling, add a refresh interval in `components/dashboard.tsx` only if you need it; the current build uses manual refresh to avoid unnecessary API calls.

## Notes

- The dashboard displays sales as `kg` to match the workbook's unit row. If a column uses a different unit, update the label and conversion rules before production.
- Monthly values and daily values are different views; do not sum a monthly MTD figure together with its daily values.
- The uploaded workbook is a wide formatted report, so it is not read directly by the live route. The Google Sheets tabs above are a normalized data feed. If the workbook will remain the sole source of truth in OneDrive/SharePoint, the integration should instead use Microsoft Graph or a controlled import workflow.
# dashboard
