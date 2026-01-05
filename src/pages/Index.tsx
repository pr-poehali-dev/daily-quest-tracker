import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
}

interface PlayerStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  aura: number;
  daysCompleted: number;
}

const Index = () => {
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('playerStats');
    return saved ? JSON.parse(saved) : {
      level: 1,
      totalXP: 0,
      xpToNextLevel: 90,
      aura: 100,
      daysCompleted: 0
    };
  });

  const [goals, setGoals] = useState<DailyGoal[]>(() => {
    const saved = localStorage.getItem('dailyGoals');
    const lastReset = localStorage.getItem('lastReset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      localStorage.setItem('lastReset', today);
      const newGoals = generateGoals(stats.level);
      localStorage.setItem('dailyGoals', JSON.stringify(newGoals));
      return newGoals;
    }
    
    return saved ? JSON.parse(saved) : generateGoals(stats.level);
  });

  function generateGoals(level: number): DailyGoal[] {
    const runDistance = 5 + (level - 1);
    const squats = 40 + (level - 1) * 5;
    const pushups = 40 + (level - 1) * 5;
    const abs = 40 + (level - 1) * 5;
    const words = 2 + (level - 1) * 2;

    return [
      { id: '1', title: `Бег ${runDistance} км`, completed: false },
      { id: '2', title: `Приседания ${squats} раз`, completed: false },
      { id: '3', title: `Отжимания ${pushups} раз`, completed: false },
      { id: '4', title: `Пресс ${abs} раз`, completed: false },
      { id: '5', title: `Новых слов ${words}`, completed: false },
    ];
  }

  useEffect(() => {
    localStorage.setItem('playerStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('dailyGoals', JSON.stringify(goals));
  }, [goals]);

  const calculateXPForNextLevel = (level: number) => {
    if (level === 1) return 90;
    return 90 + (level - 1) * 30;
  };

  const toggleGoal = (goalId: string) => {
    const newGoals = goals.map(g => 
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    setGoals(newGoals);
  };

  const allGoalsCompleted = goals.every(g => g.completed);
  const completedCount = goals.filter(g => g.completed).length;
  const progressPercent = (stats.totalXP / stats.xpToNextLevel) * 100;

  const completeDaily = () => {
    if (!allGoalsCompleted) {
      toast.error('Выполни все цели для получения награды!');
      return;
    }

    const DAILY_XP = 40;
    const newTotalXP = stats.totalXP + DAILY_XP;
    const currentLevelXP = stats.xpToNextLevel;
    
    if (newTotalXP >= currentLevelXP) {
      const newLevel = stats.level + 1;
      const newXPToNextLevel = calculateXPForNextLevel(newLevel);
      const remainingXP = newTotalXP - currentLevelXP;
      
      setStats({
        ...stats,
        level: newLevel,
        totalXP: remainingXP,
        xpToNextLevel: newXPToNextLevel,
        aura: Math.min(100, stats.aura + 10),
        daysCompleted: stats.daysCompleted + 1
      });

      const newGoals = generateGoals(newLevel);
      setGoals(newGoals);
      
      toast.success('🎉 LEVEL UP!', {
        description: `Поздравляем! Вы достигли ${newLevel} уровня!`
      });
    } else {
      setStats({
        ...stats,
        totalXP: newTotalXP,
        aura: Math.min(100, stats.aura + 5),
        daysCompleted: stats.daysCompleted + 1
      });
      
      const newGoals = generateGoals(stats.level);
      setGoals(newGoals);
      
      toast.success(`+${DAILY_XP} XP получено! 🎮`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold font-orbitron glow text-primary">
            DAILY QUEST
          </h1>
          <p className="text-muted-foreground text-lg">Прокачивай себя каждый день 🎮</p>
        </div>

        <Card className="p-6 glow-box border-primary/20 bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold animate-glow-pulse">
                {stats.level}
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold">Уровень {stats.level}</h2>
                <p className="text-sm text-muted-foreground">Аура: {stats.aura}%</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-secondary">
                <Icon name="Flame" size={24} />
                <span className="font-bold text-2xl">{completedCount}/5</span>
              </div>
              <p className="text-xs text-muted-foreground">целей выполнено</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>До {stats.level + 1} уровня</span>
              <span className="text-primary font-bold">{stats.totalXP}/{stats.xpToNextLevel} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </Card>

        <Tabs defaultValue="quest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quest" className="font-orbitron">
              <Icon name="Swords" className="mr-2" size={18} />
              Ежедневный квест
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-orbitron">
              <Icon name="BarChart3" className="mr-2" size={18} />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quest" className="space-y-6">
            <Alert className="border-destructive/50 bg-destructive/10">
              <Icon name="AlertTriangle" className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-sm ml-2">
                <strong className="font-orbitron">Обязательный квест</strong><br/>
                Невыполнение повлечет ухудшение характеристик и ауры игрока
              </AlertDescription>
            </Alert>

            <Card className="p-6 glow-box bg-card/80">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Target" size={28} className="text-primary" />
                <h2 className="text-2xl font-orbitron font-bold">Ежедневные цели</h2>
              </div>
              
              <div className="space-y-3">
                {goals.map((goal, index) => (
                  <Card 
                    key={goal.id}
                    className={`p-4 border-l-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                      goal.completed 
                        ? 'border-l-green-500 bg-green-950/20' 
                        : 'border-l-primary/50 bg-card/50'
                    }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={goal.completed}
                        onCheckedChange={() => toggleGoal(goal.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <span className={`text-lg font-medium ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {index + 1}. {goal.title}
                        </span>
                      </div>
                      {goal.completed && (
                        <Icon name="CheckCircle2" size={24} className="text-green-500" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="Trophy" size={24} className="text-primary" />
                    <div>
                      <p className="font-semibold">Награда за выполнение</p>
                      <p className="text-sm text-muted-foreground">Все цели должны быть выполнены</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-2">
                    +40 XP
                  </Badge>
                </div>
              </div>

              {allGoalsCompleted && (
                <button
                  onClick={completeDaily}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-primary to-accent rounded-lg font-orbitron font-bold text-lg hover:scale-[1.02] transition-all animate-glow-pulse"
                >
                  🎮 ПОЛУЧИТЬ НАГРАДУ
                </button>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 text-center glow-box">
                <Icon name="Trophy" size={40} className="mx-auto mb-3 text-primary" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.level}</div>
                <div className="text-sm text-muted-foreground">Текущий уровень</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Target" size={40} className="mx-auto mb-3 text-secondary" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.daysCompleted}</div>
                <div className="text-sm text-muted-foreground">Дней выполнено</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Zap" size={40} className="mx-auto mb-3 text-accent" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.totalXP}</div>
                <div className="text-sm text-muted-foreground">Текущий опыт</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Sparkles" size={40} className="mx-auto mb-3 text-primary" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.aura}%</div>
                <div className="text-sm text-muted-foreground">Аура игрока</div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-orbitron font-bold mb-4">Прогресс уровня</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Уровень {stats.level}</span>
                    <span className="text-muted-foreground">{stats.totalXP} / {stats.xpToNextLevel} XP</span>
                  </div>
                  <Progress value={progressPercent} className="h-4" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>До следующего уровня: <strong className="text-primary">{stats.xpToNextLevel - stats.totalXP} XP</strong></p>
                  <p className="mt-1">Осталось выполнить квестов: <strong className="text-secondary">{Math.ceil((stats.xpToNextLevel - stats.totalXP) / 40)}</strong></p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-orbitron font-bold mb-4">Текущие требования ({stats.level} lvl)</h3>
              <div className="space-y-2">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="flex items-center gap-3 p-2">
                    <Icon name="ChevronRight" size={16} className="text-primary" />
                    <span>{goal.title}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <div className="text-center">
                <Icon name="Star" size={48} className="mx-auto mb-3 text-primary animate-glow-pulse" />
                <h3 className="text-2xl font-orbitron font-bold mb-2">Продолжай в том же духе!</h3>
                <p className="text-muted-foreground">
                  Каждый выполненный квест приближает тебя к новым высотам! 🚀
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default Index;
