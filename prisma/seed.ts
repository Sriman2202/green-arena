import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TURFS = [
  {
    name: "GreenTurf Koramangala",
    description:
      "Premium 6-a-side football turf with FIFA-grade artificial grass, floodlights, and a shaded seating area.",
    address: "80 Feet Road, Koramangala 4th Block",
    city: "Bengaluru",
    area: "Koramangala",
    sportType: "Football",
    pricePerHour: 1200,
    openTimeMinutes: 6 * 60,
    closeTimeMinutes: 23 * 60,
    slotDurationMinutes: 60,
    amenities: ["Floodlights", "Parking", "Washroom", "Drinking Water"],
    images: ["/turfs/football-koramangala-1.jpg", "/turfs/football-koramangala-2.jpg"],
    lat: 12.9352,
    lng: 77.6146,
  },
  {
    name: "Box Cricket Arena HSR",
    description:
      "Air-conditioned indoor box cricket arena, perfect for corporate tournaments and weekend matches.",
    address: "27th Main, HSR Layout Sector 2",
    city: "Bengaluru",
    area: "HSR Layout",
    sportType: "Box Cricket",
    pricePerHour: 900,
    openTimeMinutes: 7 * 60,
    closeTimeMinutes: 24 * 60,
    slotDurationMinutes: 60,
    amenities: ["Air Conditioning", "Scoreboard", "Parking"],
    images: ["/turfs/box-cricket-hsr.jpg"],
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    name: "SmashCourt Badminton Indiranagar",
    description:
      "Wooden-floor badminton courts with professional-grade nets and equipment rental on-site.",
    address: "100 Feet Road, Indiranagar",
    city: "Bengaluru",
    area: "Indiranagar",
    sportType: "Badminton",
    pricePerHour: 500,
    openTimeMinutes: 5 * 60 + 30,
    closeTimeMinutes: 23 * 60,
    slotDurationMinutes: 60,
    amenities: ["Equipment Rental", "Changing Room", "Parking"],
    images: ["/turfs/badminton-indiranagar.jpg"],
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    name: "Andheri Sports Hub",
    description:
      "Multi-sport turf hosting 5-a-side football and futsal, with a cafe and viewing gallery.",
    address: "Veera Desai Road, Andheri West",
    city: "Mumbai",
    area: "Andheri West",
    sportType: "Futsal",
    pricePerHour: 1400,
    openTimeMinutes: 6 * 60,
    closeTimeMinutes: 24 * 60,
    slotDurationMinutes: 60,
    amenities: ["Cafe", "Floodlights", "Parking", "First Aid"],
    images: ["/turfs/futsal-andheri.jpg"],
    lat: 19.1364,
    lng: 72.8296,
  },
  {
    name: "Powai Cricket Nets",
    description:
      "Dedicated cricket practice nets with bowling machines available on request.",
    address: "Hiranandani Gardens, Powai",
    city: "Mumbai",
    area: "Powai",
    sportType: "Cricket",
    pricePerHour: 800,
    openTimeMinutes: 6 * 60,
    closeTimeMinutes: 22 * 60,
    slotDurationMinutes: 60,
    amenities: ["Bowling Machine", "Parking", "Drinking Water"],
    images: ["/turfs/cricket-nets-powai.jpg"],
    lat: 19.1176,
    lng: 72.906,
  },
  {
    name: "Gachibowli Basketball Court",
    description:
      "Outdoor full-size basketball court with night lighting, popular with local leagues.",
    address: "Financial District, Gachibowli",
    city: "Hyderabad",
    area: "Gachibowli",
    sportType: "Basketball",
    pricePerHour: 700,
    openTimeMinutes: 6 * 60,
    closeTimeMinutes: 23 * 60,
    slotDurationMinutes: 60,
    amenities: ["Floodlights", "Parking"],
    images: ["/turfs/basketball-gachibowli.jpg"],
    lat: 17.4401,
    lng: 78.3489,
  },
  {
    name: "Kondapur Tennis Club",
    description:
      "Clay and hard courts available, with coaching sessions on weekends.",
    address: "Botanical Garden Road, Kondapur",
    city: "Hyderabad",
    area: "Kondapur",
    sportType: "Tennis",
    pricePerHour: 1000,
    openTimeMinutes: 5 * 60 + 30,
    closeTimeMinutes: 22 * 60,
    slotDurationMinutes: 60,
    amenities: ["Coaching", "Equipment Rental", "Parking"],
    images: ["/turfs/tennis-kondapur.jpg"],
    lat: 17.4615,
    lng: 78.3524,
  },
  {
    name: "Wakad Football Turf",
    description:
      "Popular evening football turf with a large parking lot and snack counter.",
    address: "Datta Mandir Road, Wakad",
    city: "Pune",
    area: "Wakad",
    sportType: "Football",
    pricePerHour: 1100,
    openTimeMinutes: 6 * 60,
    closeTimeMinutes: 23 * 60 + 30,
    slotDurationMinutes: 60,
    amenities: ["Floodlights", "Parking", "Snack Counter"],
    images: ["/turfs/football-wakad.jpg"],
    lat: 18.5975,
    lng: 73.7622,
  },
];

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@greenarena.app" },
    update: { role: "SUPER_ADMIN" },
    create: {
      name: "Green Arena Admin",
      email: "admin@greenarena.app",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Seeded admin user: ${admin.email} (password: Admin@123)`);

  for (const turf of TURFS) {
    const existing = await prisma.turf.findFirst({ where: { name: turf.name } });
    if (existing) continue;
    await prisma.turf.create({ data: turf });
  }
  console.log(`Seeded ${TURFS.length} turfs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
