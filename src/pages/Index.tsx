import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
}

interface BonusQuest {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  task: string;
  restrictions: string[];
  reward: string;
  rewardEffects: string[];
  punishment: string;
  punishmentEffects: string[];
  failurePunishment?: string;
  failureEffects?: string[];
  deadline: string;
  accepted: boolean | null;
  completed: boolean;
}

interface PlayerStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  aura: number;
  daysCompleted: number;
  failedDays: number;
  aggression: number;
}

const BONUS_QUESTS: Omit<BonusQuest, 'accepted' | 'completed'>[] = [
  {
    id: 'silence',
    title: 'Зов Безмолвия',
    subtitle: 'Тишина в эпицентре',
    objective: 'Покой слуги',
    task: 'Найти самое шумное место. Остановиться, встать неподвижно и наблюдать за миром 10 минут',
    restrictions: [
      'Вам запрещено смотреть в телефон',
      'Вам запрещено смотреть на часы',
      'Вам запрещено взаимодействовать с людьми',
      'Вам запрещено вести монолог'
    ],
    reward: '«Безмятежный лир дуата»',
    rewardEffects: ['+10 стойкости', 'Способность: перезарядка энергий'],
    punishment: 'Эффект тревожности',
    punishmentEffects: ['Эффект наложения отравления'],
    failurePunishment: 'Эффект тревожности',
    failureEffects: ['Эффект наложения отравления', 'Эффект порицание местных'],
    deadline: '24 часа'
  },
  {
    id: 'contacts',
    title: 'Сеть Контактов',
    subtitle: 'Послание в бутылке',
    objective: 'Укрепление социальных связей',
    task: 'Написать и отправить 3 персональных сообщения людям, с которыми вы не общались более 6 месяцев',
    restrictions: [
      'Вам запрещено поздравлять с чем-то людей',
      'Вам запрещено пересылать сообщения',
      'Вам запрещено копировать сообщения',
      'Вам запрещено использовать телефон'
    ],
    reward: '«Стан возвращения»',
    rewardEffects: ['Положительные эффекты', 'Эффект восстановления', '+1 нифилим соратник'],
    punishment: '«Шёпот тишины»',
    punishmentEffects: [],
    deadline: '3 дня'
  },
  {
    id: 'gaze',
    title: 'Испытание Взглядом',
    subtitle: 'Зеркало чужой души',
    objective: 'Практика атонарха',
    task: 'В общественном транспорте, кафе или на улице установить зрительный контакт с незнакомым человеком и улыбнуться. 0/2 человек',
    restrictions: [],
    reward: '«Малое исцеление»',
    rewardEffects: [],
    punishment: '«Туман пустоты»',
    punishmentEffects: [],
    deadline: 'До конца дня'
  },
  {
    id: 'benefactor',
    title: 'Тайный Благодетель',
    subtitle: 'Истинный благодетель',
    objective: 'Венчание атонарха',
    task: 'Совершить 1 анонимный добрый поступок, о котором никто не узнает',
    restrictions: [],
    reward: '«Монета кармы»',
    rewardEffects: [],
    punishment: 'Аннулирование награды и получение статуса «Хаоса»',
    punishmentEffects: ['Порицание массы', 'Отравление'],
    deadline: '24 часа'
  }
];

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('playerStats');
    return saved ? JSON.parse(saved) : {
      level: 1,
      totalXP: 0,
      xpToNextLevel: 90,
      aura: 100,
      daysCompleted: 0,
      failedDays: 0,
      aggression: 0
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

  const [bonusQuest, setBonusQuest] = useState<BonusQuest | null>(() => {
    const saved = localStorage.getItem('bonusQuest');
    const lastBonusDate = localStorage.getItem('lastBonusDate');
    const today = new Date().toDateString();
    
    if (lastBonusDate !== today) {
      return null;
    }
    
    return saved ? JSON.parse(saved) : null;
  });

  const [showFailureAlert, setShowFailureAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      const hours = now.getHours();
      const lastReset = localStorage.getItem('lastReset');
      const today = now.toDateString();
      
      if (hours === 6 && lastReset !== today) {
        const allCompleted = goals.every(g => g.completed);
        
        if (!allCompleted) {
          setStats(prev => ({
            ...prev,
            aura: Math.max(0, prev.aura - 20),
            aggression: Math.min(100, prev.aggression + 10),
            failedDays: prev.failedDays + 1
          }));
          setShowFailureAlert(true);
        } else {
          setShowFailureAlert(false);
        }
        
        const newGoals = generateGoals(stats.level);
        setGoals(newGoals);
        localStorage.setItem('dailyGoals', JSON.stringify(newGoals));
        localStorage.setItem('lastReset', today);
        
        setBonusQuest(null);
        localStorage.removeItem('bonusQuest');
        localStorage.removeItem('lastBonusDate');
      }
      
      if (hours >= 6) {
        setShowFailureAlert(false);
      }
    };
    
    checkDailyReset();
  }, [currentTime]);

  useEffect(() => {
    localStorage.setItem('playerStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('dailyGoals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (bonusQuest) {
      localStorage.setItem('bonusQuest', JSON.stringify(bonusQuest));
      localStorage.setItem('lastBonusDate', new Date().toDateString());
    }
  }, [bonusQuest]);

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

  const calculateXPForNextLevel = (level: number) => {
    if (level === 1) return 90;
    return 90 + (level - 1) * 30;
  };

  const getTimeUntilDeadline = () => {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(18, 0, 0, 0);
    
    if (now.getHours() >= 18) {
      deadline.setDate(deadline.getDate() + 1);
    }
    
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, expired: diff <= 0 };
  };

  const timeRemaining = getTimeUntilDeadline();
  const isDeadlinePassed = timeRemaining.expired || (currentTime.getHours() >= 18);

  const toggleGoal = (goalId: string) => {
    if (isDeadlinePassed) {
      toast.error('Время для выполнения квестов истекло!');
      return;
    }
    
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

    if (isDeadlinePassed) {
      toast.error('Время для выполнения квестов истекло!');
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

  const generateBonusQuest = () => {
    const randomQuest = BONUS_QUESTS[Math.floor(Math.random() * BONUS_QUESTS.length)];
    setBonusQuest({
      ...randomQuest,
      accepted: null,
      completed: false
    });
  };

  const acceptBonusQuest = () => {
    if (bonusQuest) {
      setBonusQuest({ ...bonusQuest, accepted: true });
      toast.success('Квест принят!');
    }
  };

  const rejectBonusQuest = () => {
    if (bonusQuest) {
      toast.error(`Наказание: ${bonusQuest.punishment}`);
      bonusQuest.punishmentEffects.forEach(effect => {
        toast.error(effect, { duration: 3000 });
      });
      setBonusQuest(null);
      localStorage.removeItem('bonusQuest');
    }
  };

  const completeBonusQuest = () => {
    if (bonusQuest && bonusQuest.accepted) {
      const BONUS_XP = 50;
      const newTotalXP = stats.totalXP + BONUS_XP;
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
          aura: Math.min(100, stats.aura + 15)
        });
        
        toast.success('🎉 LEVEL UP!', {
          description: `Поздравляем! Вы достигли ${newLevel} уровня!`
        });
      } else {
        setStats({
          ...stats,
          totalXP: newTotalXP,
          aura: Math.min(100, stats.aura + 10)
        });
        
        toast.success(`+${BONUS_XP} XP за дополнительный квест! 🎁`);
      }
      
      toast.success(`Получена награда: ${bonusQuest.reward}`);
      bonusQuest.rewardEffects.forEach(effect => {
        toast.success(effect, { duration: 3000 });
      });
      
      setBonusQuest(null);
      localStorage.removeItem('bonusQuest');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold font-orbitron glow text-primary">
            ВОСХОЖДЕНИЕ АТОНАРХА
          </h1>
        </div>

        {showFailureAlert && (
          <Alert className="border-destructive bg-destructive/20 animate-slide-up">
            <Icon name="Skull" className="h-6 w-6 text-destructive" />
            <AlertTitle className="text-xl font-orbitron text-destructive">
              ⚠️ ПРОВАЛ ЗАДАНИЯ
            </AlertTitle>
            <AlertDescription className="text-destructive-foreground mt-2">
              <p className="font-semibold">Вы не выполнили обязательное задание.</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Ваша аура и характеристики снижены</li>
                <li>• На вас наложен эффект обременения</li>
                <li>• Аура агрессии повышена на 10%</li>
              </ul>
              <p className="mt-2 text-xs opacity-80">Это уведомление исчезнет в 6:00 следующего дня</p>
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6 glow-box border-primary/20 bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold animate-glow-pulse">
                {stats.level}
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold">Уровень {stats.level}</h2>
                <p className="text-sm text-muted-foreground">Аура: {stats.aura}% | Агрессия: {stats.aggression}%</p>
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
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>До {stats.level + 1} уровня</span>
              <span className="text-primary font-bold">{stats.totalXP}/{stats.xpToNextLevel} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <div className={`p-3 rounded-lg ${isDeadlinePassed ? 'bg-destructive/20 border border-destructive' : 'bg-primary/10 border border-primary/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={20} className={isDeadlinePassed ? 'text-destructive' : 'text-primary'} />
                <span className="font-semibold">Время до дедлайна (18:00)</span>
              </div>
              <div className={`font-orbitron font-bold text-lg ${isDeadlinePassed ? 'text-destructive' : 'text-primary'}`}>
                {isDeadlinePassed ? 'ИСТЕКЛО' : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
              </div>
            </div>
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
            {!isDeadlinePassed && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <Icon name="AlertTriangle" className="h-5 w-5 text-destructive" />
                <AlertDescription className="text-sm ml-2">
                  <strong className="font-orbitron">Обязательный квест</strong><br/>
                  Невыполнение повлечет ухудшение характеристик и ауры игрока
                </AlertDescription>
              </Alert>
            )}

            <Card className="p-6 glow-box bg-card/80">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Target" size={28} className="text-primary" />
                <h2 className="text-2xl font-orbitron font-bold">Ежедневные цели</h2>
              </div>
              
              <div className="space-y-3">
                {goals.map((goal, index) => (
                  <Card 
                    key={goal.id}
                    className={`p-4 border-l-4 transition-all duration-300 ${
                      isDeadlinePassed 
                        ? 'opacity-50 cursor-not-allowed border-l-muted'
                        : goal.completed 
                          ? 'border-l-green-500 bg-green-950/20 hover:scale-[1.01] cursor-pointer' 
                          : 'border-l-primary/50 bg-card/50 hover:scale-[1.01] cursor-pointer'
                    }`}
                    onClick={() => !isDeadlinePassed && toggleGoal(goal.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={goal.completed}
                        onCheckedChange={() => !isDeadlinePassed && toggleGoal(goal.id)}
                        className="w-5 h-5"
                        disabled={isDeadlinePassed}
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

              {allGoalsCompleted && !isDeadlinePassed && (
                <Button
                  onClick={completeDaily}
                  className="w-full mt-4 py-6 bg-gradient-to-r from-primary to-accent text-lg font-orbitron font-bold hover:scale-[1.02] transition-all animate-glow-pulse"
                >
                  🎮 ПОЛУЧИТЬ НАГРАДУ
                </Button>
              )}
            </Card>

            {allGoalsCompleted && !bonusQuest && !isDeadlinePassed && (
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                <div className="text-center space-y-3">
                  <Icon name="Sparkles" size={48} className="mx-auto text-primary animate-glow-pulse" />
                  <h3 className="text-xl font-orbitron font-bold">Доступен дополнительный квест!</h3>
                  <p className="text-muted-foreground">Хотите получить случайный квест за +50 XP?</p>
                  <Button
                    onClick={generateBonusQuest}
                    className="w-full py-4 bg-gradient-to-r from-accent to-primary font-orbitron font-bold hover:scale-[1.02] transition-all"
                  >
                    🎁 ПОЛУЧИТЬ ДОПОЛНИТЕЛЬНЫЙ КВЕСТ
                  </Button>
                </div>
              </Card>
            )}

            {bonusQuest && (
              <Card className="p-6 border-2 border-accent bg-gradient-to-br from-accent/5 to-primary/5">
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge className="mb-2 bg-accent text-accent-foreground">ВНЕЗАПНЫЙ КВЕСТ</Badge>
                    <h3 className="text-2xl font-orbitron font-bold text-accent mb-1">{bonusQuest.title}</h3>
                    <p className="text-lg italic">{bonusQuest.subtitle}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-primary">Цель:</p>
                      <p>{bonusQuest.objective}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-primary">Задание:</p>
                      <p>{bonusQuest.task}</p>
                    </div>

                    {bonusQuest.restrictions.length > 0 && (
                      <div>
                        <p className="font-semibold text-destructive">Ограничения:</p>
                        <ul className="space-y-1 mt-1">
                          {bonusQuest.restrictions.map((r, i) => (
                            <li key={i} className="text-sm text-destructive/90">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-green-500">Награда:</p>
                      <p className="text-green-400">{bonusQuest.reward}</p>
                      {bonusQuest.rewardEffects.length > 0 && (
                        <ul className="space-y-1 mt-1">
                          {bonusQuest.rewardEffects.map((e, i) => (
                            <li key={i} className="text-sm text-green-400/90">• {e}</li>
                          ))}
                        </ul>
                      )}
                      <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">+50 XP</Badge>
                    </div>

                    <div>
                      <p className="font-semibold text-destructive">Наказание за отказ:</p>
                      <p className="text-destructive/90">{bonusQuest.punishment}</p>
                      {bonusQuest.punishmentEffects.length > 0 && (
                        <ul className="space-y-1 mt-1">
                          {bonusQuest.punishmentEffects.map((e, i) => (
                            <li key={i} className="text-sm text-destructive/80">• {e}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {bonusQuest.failurePunishment && (
                      <div>
                        <p className="font-semibold text-destructive">Наказание за невыполнение:</p>
                        <p className="text-destructive/90">{bonusQuest.failurePunishment}</p>
                        {bonusQuest.failureEffects && bonusQuest.failureEffects.length > 0 && (
                          <ul className="space-y-1 mt-1">
                            {bonusQuest.failureEffects.map((e, i) => (
                              <li key={i} className="text-sm text-destructive/80">• {e}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Icon name="Clock" size={16} className="text-primary" />
                      <span className="text-sm">Срок: {bonusQuest.deadline}</span>
                    </div>
                  </div>

                  {bonusQuest.accepted === null && (
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={acceptBonusQuest}
                        className="flex-1 py-4 bg-green-600 hover:bg-green-700 font-orbitron font-bold"
                      >
                        ✓ ДА
                      </Button>
                      <Button
                        onClick={rejectBonusQuest}
                        variant="destructive"
                        className="flex-1 py-4 font-orbitron font-bold"
                      >
                        ✗ НЕТ
                      </Button>
                    </div>
                  )}

                  {bonusQuest.accepted && !bonusQuest.completed && (
                    <Button
                      onClick={completeBonusQuest}
                      className="w-full mt-4 py-4 bg-gradient-to-r from-green-600 to-accent font-orbitron font-bold hover:scale-[1.02] transition-all"
                    >
                      ✓ КВЕСТ ВЫПОЛНЕН
                    </Button>
                  )}
                </div>
              </Card>
            )}
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
              <Card className="p-6 text-center glow-box">
                <Icon name="Skull" size={40} className="mx-auto mb-3 text-destructive" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.failedDays}</div>
                <div className="text-sm text-muted-foreground">Провалов</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Flame" size={40} className="mx-auto mb-3 text-destructive" />
                <div className="text-4xl font-bold font-orbitron mb-1">{stats.aggression}%</div>
                <div className="text-sm text-muted-foreground">Агрессия</div>
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
                <h3 className="text-2xl font-orbitron font-bold mb-2">Путь Атонарха</h3>
                <p className="text-muted-foreground">
                  Каждый выполненный квест приближает тебя к восхождению! 🚀
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
