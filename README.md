## Development setup guide

1. Clone the repo and enter it:

- `git clone https://github.com/PictureElement/calendar-module-2025.git && cd calendar-module-2025`

2. Install dependencies:

- `npm install`

3. Start the dev server:

- `npm run dev`

**If the live API is unavailable or expired, the app features an offline fallback mode that renders mock data from `/src/events.json`. You can manually toggle this by adjusting the `USE_LOCAL_JSON` variable in `api.js`.**
