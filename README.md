# Kayfarm Executive 3D Workstation HQ

An interactive, walkable 3D Executive Office Building built with **Next.js 14**, **React Three Fiber / Three.js**, **Tailwind CSS**, and **AWS Serverless (Terraform + DynamoDB + Lambda + API Gateway + S3 + CloudFront)**.

## Key Features

1. **Walk-In Multi-Room 3D Executive Office Building**
   - **Exterior Compound & Gate (Kayfarm Estate Style)**: Asphalt avenue, concrete drainage gutters with culvert bridge slab, interlocking stone forecourt, illuminated entrance archway, and automatic sliding glass doors that open as you approach.
   - **Grand Reception Lobby**: Carrara marble tiles, reception concierge desk, and open glass partition leading into the executive suite.
   - **Main Executive Office Suite**: Polished walnut hardwood floors, executive command desk with dual curved monitors, and two flagship interactive wall stations.
   - **West Focus & Espresso Lounge**: L-shaped sofa, coffee table, and espresso bar for recharge breaks.

2. **85" Smart TV Wall — Live To-Do Checklist**
   - Renders your real-time To-Do list directly onto the 3D TV screen on the East Wall (`@react-three/drei` `<Html transform>`).
   - Check off tasks directly on the 3D TV or open the full-screen Smart TV Manager (`E` key or click) to filter by status, set priorities (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), track estimated minutes, and view your daily completion progress bar.

3. **Giant Daily Activity & Kanban Whiteboard**
   - Mounted on the North Wall with three live columns: **Planned Today**, **Doing Right Now (In Office)**, and **Done Today**, plus a **Pinned Sticky Notes** section.
   - Clicking **Do Activity Now** starts that activity in your office and automatically launches the Pomodoro / Deep-Work timer.
   - Completing an activity that is linked to a TV To-Do item automatically checks off that To-Do on your Office TV.

4. **Executive Command Desk & Audio Synthesizer**
   - Built-in **Pomodoro & Deep-Work Timer** (25m Pomodoro, 50m Deep Work, 10m Recharge Break).
   - **Cloud Scratchpad** for daily architecture notes and logs.
   - **Quick Links Launcher** and a zero-dependency **Web Audio API Ambient Focus Sound Generator** (warm brown noise + completion chimes).

## Local Development

```powershell
npm install
npm run dev
```

## Production AWS Deployment (Terraform + DynamoDB)

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```
