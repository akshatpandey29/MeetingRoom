require("../src/config/env");

const { connectDB, disconnectDB } = require("../src/config/database");
const { User, Room } = require("../src/models");

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Room.deleteMany({});

    await User.create({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "Admin@123",
      role: "admin",
      isActive: true,
    });

    await User.create({
      name: "Normal User",
      email: "user@gmail.com",
      password: "User@123",
      role: "user",
      isActive: true,
    });

    await Room.create([
      {
        name: "Conference Room A",
        location: "First Floor",
        capacity: 20,
        status: "available",
        isActive: true,
        description: "Large meeting room for team discussions",
        amenities: ["Projector", "Whiteboard", "WiFi"],
      },
      {
        name: "Meeting Room B",
        location: "Second Floor",
        capacity: 10,
        status: "available",
        isActive: true,
        description: "Small room for quick meetings",
        amenities: ["TV", "WiFi"],
      },
    ]);

    console.log("Seed completed successfully.");
    console.log("Chal chal chup chapp code kar");
    console.log("Admin login: admin@plaxonic.com / Admin@123");
    console.log("User login: user@plaxonic.com / User@123");

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await disconnectDB();
    process.exit(1);
  }
};

seedData();