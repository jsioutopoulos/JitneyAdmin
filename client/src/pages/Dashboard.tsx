import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { trips, vehicles, crew } from "@/lib/mockData";
import { Bus, Users, AlertCircle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import mapBg from "@assets/generated_images/subtle_topological_map_background.png";

export default function Dashboard() {
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const activeTrips = trips.filter(t => t.status === 'en-route').length;
  const upcomingTrips = trips.filter(t => t.status === 'scheduled').length;
  const assignedCrew = crew.filter(c => c.status === 'assigned').length;

  const chartData = [
    { name: '6 AM', trips: 2 },
    { name: '8 AM', trips: 4 },
    { name: '10 AM', trips: 1 },
    { name: '12 PM', trips: 3 },
    { name: '2 PM', trips: 5 },
    { name: '4 PM', trips: 2 },
    { name: '6 PM', trips: 1 },
  ];

  return (
    <Layout>
      <Header title="Operations Overview" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Active Fleet" 
            value={`${activeVehicles}/${vehicles.length}`} 
            subtext={`${maintenanceVehicles} in maintenance`}
            icon={Bus}
            trend="+2"
            trendUp={true}
          />
          <StatCard 
            title="Active Trips" 
            value={activeTrips.toString()} 
            subtext={`${upcomingTrips} upcoming`}
            icon={MapPin}
            trend="On Schedule"
            trendUp={true}
          />
          <StatCard 
            title="Crew Assigned" 
            value={assignedCrew.toString()} 
            subtext={`${crew.length - assignedCrew} available`}
            icon={Users}
            trend="98% Fill Rate"
            trendUp={true}
          />
          <StatCard 
            title="System Alerts" 
            value="2" 
            subtext="Requires attention"
            icon={AlertCircle}
            trend="Critical"
            trendUp={false}
            alert
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map Area Placeholder */}
          <Card className="lg:col-span-2 overflow-hidden border-border/60 shadow-sm flex flex-col">
            <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Live Fleet Map
              </CardTitle>
            </CardHeader>
            <div className="flex-1 relative min-h-[300px] bg-muted/10 p-4">
               <div 
                 className="absolute inset-0 opacity-20 mix-blend-multiply"
                 style={{ backgroundImage: `url(${mapBg})`, backgroundSize: 'cover' }}
               />
               <div className="relative z-10 h-full flex items-center justify-center text-muted-foreground">
                 <div className="text-center space-y-2">
                   <Bus className="h-12 w-12 mx-auto text-primary/40" />
                   <p>Live GPS Integration Active</p>
                   <p className="text-xs max-w-xs mx-auto opacity-70">Real-time vehicle positions from Samsara integration would appear here.</p>
                 </div>
               </div>
            </div>
          </Card>

          {/* Volume Chart */}
          <Card className="border-border/60 shadow-sm flex flex-col">
            <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Trip Volume
              </CardTitle>
            </CardHeader>
            <div className="flex-1 p-4 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="trips" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Activity / Alerts Table */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-border/40">
               {[1, 2, 3].map((_, i) => (
                 <div key={i} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors cursor-pointer">
                   <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                     <AlertCircle className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-foreground">Maintenance Request: Ambassador 304</p>
                     <p className="text-xs text-muted-foreground mt-1">Reported by Driver J. Wilson at 08:45 AM</p>
                   </div>
                   <div className="ml-auto text-xs text-muted-foreground font-mono">08:45</div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, subtext, icon: Icon, trend, trendUp, alert }: any) {
  return (
    <Card className={`border shadow-sm ${alert ? 'border-destructive/50 bg-destructive/5' : 'border-border/60'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{subtext}</span>
          <span className={`font-medium ${trendUp ? 'text-emerald-600' : alert ? 'text-destructive' : 'text-muted-foreground'}`}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
