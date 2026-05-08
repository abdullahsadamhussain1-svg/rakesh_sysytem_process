# 🌿 Aafiya Clinic - Siddha Varmam Assessment Software

A modern, web-based patient assessment system for Siddha Varmam clinics. Replace paper forms with a beautiful digital interface that saves directly to Google Sheets.

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

- 📝 **Comprehensive Assessment Form** - Capture all patient details, history, examination results, and tests
- 📊 **Dashboard View** - See all patient assessments in a clean table format
- ☁️ **Google Sheets Backend** - No database setup required, data saves directly to Google Sheets
- 🎨 **Modern UI** - Built with Radix UI components and Tailwind CSS
- ✅ **Form Validation** - Zod schema validation ensures data quality
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Sheets

Follow the detailed guide in **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**

Quick summary:
1. Create a Google Sheet with the column headers from `COLUMN_HEADERS.md`
2. Create an Apps Script using code from `scripts/google-apps-script.js`
3. Deploy the Apps Script as a Web App
4. Copy the Web App URL

### 3. Configure Environment

Create a `.env.local` file (see `ENV_SAMPLE.txt` for template):

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Full setup instructions
- **[AUTHORIZATION_GUIDE.md](./AUTHORIZATION_GUIDE.md)** - How to handle Google's authorization warning
- **[COLUMN_HEADERS.md](./COLUMN_HEADERS.md)** - Google Sheets column reference
- **[scripts/google-apps-script.js](./scripts/google-apps-script.js)** - Apps Script code

## 🏗️ Project Structure

```
physio_sw/
├── app/
│   ├── page.tsx              # Dashboard (home page)
│   ├── new/page.tsx          # New assessment form page
│   ├── api/assessments/      # API routes
│   └── layout.tsx            # Root layout
├── components/
│   ├── assessment-form.tsx   # Main form component
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── apps-script.ts        # Google Apps Script integration
│   └── google-sheets.ts      # Legacy Google Sheets API (optional)
└── scripts/
    └── google-apps-script.js # Apps Script code for Google Sheets
```

## 🔧 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Backend**: Google Sheets via Apps Script
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)

## 📋 Assessment Form Fields

The form captures:
- **Patient Details**: Name, Age, Occupation
- **History**: Mechanism of injury, aggravating factors, 24-hour history
- **Observation**: Posture and visual assessment
- **Examination**: Active/passive movements, end feel, capsular pattern
- **Pain Assessment**: VAS scale (0-10), pain pattern, location
- **Tests**: Resisted isometrics, functional testing, neurological tests, special tests
- **Palpation**: Tenderness, effusion

## 🔐 Security & Privacy

- Data is stored in YOUR Google Sheet
- Apps Script runs under YOUR Google account
- No third-party data storage
- All data stays within your Google Workspace

## 🐛 Troubleshooting

### "Google hasn't verified this app" warning
This is **completely normal**! See [AUTHORIZATION_GUIDE.md](./AUTHORIZATION_GUIDE.md) for details.

### Data not saving
1. Check your `.env.local` has the correct `GOOGLE_APPS_SCRIPT_URL`
2. Verify the Apps Script is deployed with "Anyone" access
3. Check browser console (F12) for errors

### Column mismatch errors
Ensure your Google Sheet headers exactly match those in `COLUMN_HEADERS.md`

## 🚢 Deployment

### Deploy to Vercel

```bash
npm run build
```

Then deploy to [Vercel](https://vercel.com):
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your `GOOGLE_APPS_SCRIPT_URL` environment variable
4. Deploy!

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section in [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
2. Review the browser console for errors
3. Check the Apps Script logs in Google Apps Script editor

---

**Built with ❤️ for Siddha Varmam clinics** | Last updated: December 2025
