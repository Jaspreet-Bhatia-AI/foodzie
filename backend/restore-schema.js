const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('campusCredits')) {
  schema = schema.replace('role              String      @default("Student")', 'role              String      @default("Student")\n  campusCredits     Int         @default(0)\n  resetToken        String?     @db.Text\n  resetTokenExpiry  DateTime?');
}

if (!schema.includes('scheduledTime')) {
  schema = schema.replace('status           String      @default("Pending")', 'status           String      @default("Pending")\n  scheduledTime    DateTime?');
}

if (!schema.includes('SquadCart')) {
  schema += `
model SquadCart {
  id        String          @id @default(uuid())
  vendorId  String
  creatorId String
  isActive  Boolean         @default(true)
  createdAt DateTime        @default(now())
  items     SquadCartItem[]
}

model SquadCartItem {
  id         String    @id @default(uuid())
  cartId     String
  foodItemId String
  quantity   Int
  addedById  String
  cart       SquadCart @relation(fields: [cartId], references: [id])
}
`;
}

fs.writeFileSync('prisma/schema.prisma', schema);
