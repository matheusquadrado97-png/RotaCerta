import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Calendar, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Gerencie horários e mecânicos"
  },
  {
    icon: Users,
    title: "Mais Clientes",
    description: "Leads qualificados do app"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Métricas de desempenho"
  },
  {
    icon: Wrench,
    title: "Estoque",
    description: "Controle de peças integrado"
  }
];

export const WorkshopCTASection = () => {
  return (
    <section className="py-24 bg-secondary overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-secondary-foreground">
            <span className="inline-block px-4 py-2 bg-primary/20 rounded-full text-primary font-medium text-sm">
              Para Oficinas
            </span>

            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Transforme sua oficina em um{" "}
              <span className="text-primary">negócio digital</span>
            </h2>

            <p className="text-secondary-foreground/80 text-lg leading-relaxed">
              Plataforma completa para gerenciar sua oficina de bicicletas.
              Agenda, clientes, estoque e muito mais em um só lugar.
              Atraia novos clientes diretamente do nosso app.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-center gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{benefit.title}</p>
                    <p className="text-secondary-foreground/70 text-xs">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?tab=register">
                <Button variant="hero" size="lg">
                  Cadastrar Oficina
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  Ver planos e preços
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg text-foreground">Dashboard da Oficina</h3>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">Online</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-2xl font-display font-bold text-foreground">23</p>
                  <p className="text-muted-foreground text-sm">Agendamentos</p>
                </div>
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-2xl font-display font-bold text-foreground">R$ 4.8k</p>
                  <p className="text-muted-foreground text-sm">Faturamento</p>
                </div>
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-2xl font-display font-bold text-foreground">4.9</p>
                  <p className="text-muted-foreground text-sm">Avaliação</p>
                </div>
              </div>

              {/* Today's schedule */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">Agenda de Hoje</h4>
                <ScheduleItem time="09:00" client="Carlos M." service="Revisão Completa" status="done" />
                <ScheduleItem time="11:30" client="Ana P." service="Troca de Corrente" status="inProgress" />
                <ScheduleItem time="14:00" client="Pedro S." service="Regulagem Freios" status="pending" />
                <ScheduleItem time="16:30" client="Julia R." service="Troca Pastilhas" status="pending" />
              </div>
            </div>

            {/* Floating notification */}
            <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg p-4 border border-border animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <span className="text-success-foreground text-sm">+1</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Novo agendamento!</p>
                  <p className="text-muted-foreground text-xs">Via app Pelot�o.io</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ScheduleItem = ({
  time,
  client,
  service,
  status
}: {
  time: string;
  client: string;
  service: string;
  status: 'done' | 'inProgress' | 'pending';
}) => {
  const statusStyles = {
    done: 'bg-success/10 text-success',
    inProgress: 'bg-warning/10 text-warning',
    pending: 'bg-muted text-muted-foreground'
  };

  const statusLabels = {
    done: 'Concluído',
    inProgress: 'Em andamento',
    pending: 'Pendente'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-muted-foreground">{time}</span>
        <div>
          <p className="font-medium text-sm text-foreground">{client}</p>
          <p className="text-muted-foreground text-xs">{service}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    </div>
  );
};
