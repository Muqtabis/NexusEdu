import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaService } from "../prisma.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "default-secret-change-me",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  providers: [JwtStrategy, PrismaService],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
