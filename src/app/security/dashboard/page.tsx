import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityDashboardPage() {
  return (
    <div className="container mx-auto">
      <PageHeader
        title="Security Dashboard"
        description="Monitor campus security and manage visitor access."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-medium font-headline">Visitor Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage recent visitor access and sign-ins.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-medium font-headline">Incident Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Log and view recent security incidents.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
