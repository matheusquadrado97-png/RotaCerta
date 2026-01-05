import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Bell, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-warning/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm">
              <Bike className="w-4 h-4" />
              <span>Integração oficial com Strava</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
              Sua bike sempre{" "}
              <span className="text-gradient">pronta para rodar</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Conecte seu Strava, monitore o desgaste dos componentes automaticamente
              e agende manutenções com oficinas certificadas perto de você.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Começar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  Criar conta
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div>
                <p className="font-display text-3xl font-bold text-foreground">10k+</p>
                <p className="text-muted-foreground text-sm">Ciclistas ativos</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-foreground">500+</p>
                <p className="text-muted-foreground text-sm">Oficinas parceiras</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-foreground">98%</p>
                <p className="text-muted-foreground text-sm">Satisfação</p>
              </div>
            </div>
          </div>

          {/* Right content - Feature cards */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative z-10 space-y-4">
              {/* Main dashboard preview card */}
              <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg">Canyon Aeroad CF SLX</h3>
                    <p className="text-muted-foreground text-sm">2,450 km rodados</p>
                  </div>
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <Bike className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Component health bars */}
                <div className="space-y-4">
                  <ComponentHealth name="Corrente" percentage={35} status="warning" />
                  <ComponentHealth name="Pneus" percentage={68} status="good" />
                  <ComponentHealth name="Cabos de Freio" percentage={82} status="good" />
                  <ComponentHealth name="Pastilhas" percentage={15} status="critical" />
                </div>
              </div>

              {/* Alert notification */}
              <div className="absolute -right-4 top-1/3 bg-card rounded-xl shadow-lg p-4 border border-border animate-float max-w-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Manutenção Urgente</p>
                    <p className="text-muted-foreground text-xs">Pastilhas de freio com apenas 15% de vida útil</p>
                  </div>
                </div>
              </div>

              {/* Booking card */}
              <div className="absolute -left-8 bottom-0 bg-card rounded-xl shadow-lg p-4 border border-border animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Agendamento Confirmado</p>
                    <p className="text-muted-foreground text-xs">Bike Shop Pro • Amanhã, 14h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ComponentHealth = ({
  name,
  percentage,
  status
}: {
  name: string;
  percentage: number;
  status: 'good' | 'warning' | 'critical'
}) => {
  const statusColors = {
    good: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-destructive'
  };

  const statusBgColors = {
    good: 'bg-success/20',
    warning: 'bg-warning/20',
    critical: 'bg-destructive/20'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBgColors[status]} ${status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive'}`}>
          {percentage}% restante
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColors[status]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
