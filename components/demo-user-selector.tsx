"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Gavel, Eye } from "lucide-react";

interface DemoUserSelectorProps {
  currentUserType: "auctioneer" | "supplier" | "citizen";
  onUserTypeChange: (userType: "auctioneer" | "supplier" | "citizen") => void;
}

export function DemoUserSelector({ currentUserType, onUserTypeChange }: DemoUserSelectorProps) {
  const userTypes = [
    {
      type: "auctioneer" as const,
      label: "Pregoeiro",
      icon: Gavel,
      description: "Gerencia a disputa",
      color: "bg-blue-500",
    },
    {
      type: "supplier" as const,
      label: "Fornecedor",
      icon: Users,
      description: "Participa da disputa",
      color: "bg-green-500",
    },
    {
      type: "citizen" as const,
      label: "Observador",
      icon: Eye,
      description: "Acompanha a disputa",
      color: "bg-gray-500",
    },
  ];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Demonstrar como:</span>
            <Badge variant="outline" className="text-sm">
              {userTypes.find((u) => u.type === currentUserType)?.label}
            </Badge>
          </div>

          <div className="flex gap-2">
            {userTypes.map((userType) => {
              const Icon = userType.icon;
              const isActive = currentUserType === userType.type;

              return (
                <Button
                  key={userType.type}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUserTypeChange(userType.type)}
                  className={`flex items-center gap-2 ${isActive ? userType.color : ""}`}>
                  <Icon className="h-4 w-4" />
                  {userType.label}
                </Button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 Troque entre os tipos de usuário para ver diferentes funcionalidades
        </p>
      </CardContent>
    </Card>
  );
}
