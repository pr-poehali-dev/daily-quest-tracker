import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type SkillType = 'strength' | 'intelligence' | 'agility' | 'charisma' | 'endurance';

interface Quest {
  id: string;
  title: string;
  description: string;
  skill: SkillType;
  xp: number;
  completed: boolean;
}

interface PlayerStats {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  currentXP: number;
  skills: Record<SkillType, { level: number; xp: number }>;
  totalQuestsCompleted: number;
  streak: number;
}

const SKILL_ICONS: Record<SkillType, string> = {
  strength: 'Dumbbell',
  intelligence: 'Brain',
  agility: 'Zap',
  charisma: 'Sparkles',
  endurance: 'Heart'
};

const SKILL_COLORS: Record<SkillType, string> = {
  strength: 'text-red-500',
  intelligence: 'text-blue-500',
  agility: 'text-yellow-500',
  charisma: 'text-pink-500',
  endurance: 'text-green-500'
};

const initialQuests: Quest[] = [
  { id: '1', title: 'Утренняя зарядка', description: '20 минут физических упражнений', skill: 'strength', xp: 50, completed: false },
  { id: '2', title: 'Прочитать 30 страниц книги', description: 'Развивай свой интеллект', skill: 'intelligence', xp: 40, completed: false },
  { id: '3', title: 'Медитация 10 минут', description: 'Сфокусируйся на дыхании', skill: 'endurance', xp: 30, completed: false },
  { id: '4', title: 'Выучить 10 новых слов', description: 'Иностранный язык или профессиональная лексика', skill: 'intelligence', xp: 35, completed: false },
  { id: '5', title: 'Социальное взаимодействие', description: 'Позвони другу или встреться с кем-то', skill: 'charisma', xp: 40, completed: false },
  { id: '6', title: 'Быстрая реакция', description: 'Игра на реакцию или спортивная активность', skill: 'agility', xp: 45, completed: false },
];

const Index = () => {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    totalXP: 0,
    xpToNextLevel: 100,
    currentXP: 0,
    skills: {
      strength: { level: 1, xp: 0 },
      intelligence: { level: 1, xp: 0 },
      agility: { level: 1, xp: 0 },
      charisma: { level: 1, xp: 0 },
      endurance: { level: 1, xp: 0 }
    },
    totalQuestsCompleted: 0,
    streak: 0
  });

  const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 10)) + 1;
  const calculateXPForNextLevel = (level: number) => Math.pow(level, 2) * 10;

  const toggleQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const newCompleted = !quest.completed;
    
    setQuests(quests.map(q => 
      q.id === questId ? { ...q, completed: newCompleted } : q
    ));

    if (newCompleted) {
      const newTotalXP = stats.totalXP + quest.xp;
      const newCurrentXP = stats.currentXP + quest.xp;
      const newLevel = calculateLevel(newTotalXP);
      const leveledUp = newLevel > stats.level;

      const newSkillXP = stats.skills[quest.skill].xp + quest.xp;
      const newSkillLevel = calculateLevel(newSkillXP);

      setStats({
        ...stats,
        totalXP: newTotalXP,
        currentXP: newCurrentXP,
        level: newLevel,
        xpToNextLevel: calculateXPForNextLevel(newLevel),
        skills: {
          ...stats.skills,
          [quest.skill]: { level: newSkillLevel, xp: newSkillXP }
        },
        totalQuestsCompleted: stats.totalQuestsCompleted + 1
      });

      toast.success(`+${quest.xp} XP за квест! 🎮`, {
        description: leveledUp ? `🎉 Уровень повышен до ${newLevel}!` : undefined
      });
    } else {
      const newTotalXP = Math.max(0, stats.totalXP - quest.xp);
      const newCurrentXP = Math.max(0, stats.currentXP - quest.xp);
      const newLevel = calculateLevel(newTotalXP);

      const newSkillXP = Math.max(0, stats.skills[quest.skill].xp - quest.xp);
      const newSkillLevel = calculateLevel(newSkillXP);

      setStats({
        ...stats,
        totalXP: newTotalXP,
        currentXP: newCurrentXP,
        level: newLevel,
        xpToNextLevel: calculateXPForNextLevel(newLevel),
        skills: {
          ...stats.skills,
          [quest.skill]: { level: newSkillLevel, xp: newSkillXP }
        },
        totalQuestsCompleted: Math.max(0, stats.totalQuestsCompleted - 1)
      });
    }
  };

  const completedToday = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  const progressPercent = (stats.currentXP / stats.xpToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold font-orbitron glow text-primary">
            DAILY QUESTS
          </h1>
          <p className="text-muted-foreground text-lg">Прокачивай себя каждый день 🎮</p>
        </div>

        <Card className="p-6 glow-box border-primary/20 bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold animate-glow-pulse">
                {stats.level}
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold">Уровень {stats.level}</h2>
                <p className="text-sm text-muted-foreground">{stats.totalXP} общего опыта</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-secondary">
                <Icon name="Flame" size={20} />
                <span className="font-bold">{completedToday}/{totalQuests}</span>
              </div>
              <p className="text-xs text-muted-foreground">квестов сегодня</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>До {stats.level + 1} уровня</span>
              <span className="text-primary font-bold">{stats.currentXP}/{stats.xpToNextLevel} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </Card>

        <Tabs defaultValue="quests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="quests" className="font-orbitron">
              <Icon name="ListChecks" className="mr-2" size={18} />
              Квесты
            </TabsTrigger>
            <TabsTrigger value="profile" className="font-orbitron">
              <Icon name="User" className="mr-2" size={18} />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-orbitron">
              <Icon name="BarChart3" className="mr-2" size={18} />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="space-y-4">
            {quests.map((quest, index) => (
              <Card 
                key={quest.id} 
                className={`p-5 border-l-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  quest.completed 
                    ? 'border-l-green-500 bg-green-950/20' 
                    : 'border-l-primary/50 bg-card/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => toggleQuest(quest.id)}
              >
                <div className="flex items-start gap-4">
                  <Checkbox 
                    checked={quest.completed}
                    onCheckedChange={() => toggleQuest(quest.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${quest.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {quest.title}
                      </h3>
                      <Icon name={SKILL_ICONS[quest.skill]} size={16} className={SKILL_COLORS[quest.skill]} />
                    </div>
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    +{quest.xp} XP
                  </Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 text-center glow-box">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-4xl font-bold mb-4 animate-glow-pulse">
                {stats.level}
              </div>
              <h2 className="text-3xl font-orbitron font-bold mb-2">Игрок Уровень {stats.level}</h2>
              <p className="text-muted-foreground mb-4">{stats.totalXP} общего опыта</p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalQuestsCompleted}</div>
                  <div className="text-xs text-muted-foreground">Квестов выполнено</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{completedToday}</div>
                  <div className="text-xs text-muted-foreground">Сегодня выполнено</div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-orbitron font-bold text-center">Навыки персонажа</h3>
              {Object.entries(stats.skills).map(([skill, data]) => {
                const skillPercent = (data.xp % calculateXPForNextLevel(data.level)) / calculateXPForNextLevel(data.level) * 100;
                return (
                  <Card key={skill} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Icon 
                          name={SKILL_ICONS[skill as SkillType]} 
                          size={24} 
                          className={SKILL_COLORS[skill as SkillType]} 
                        />
                        <div>
                          <h4 className="font-semibold capitalize">{skill}</h4>
                          <p className="text-xs text-muted-foreground">Уровень {data.level}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{data.xp} XP</Badge>
                    </div>
                    <Progress value={skillPercent} className="h-2" />
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center glow-box">
                <Icon name="Trophy" size={32} className="mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold font-orbitron">{stats.level}</div>
                <div className="text-sm text-muted-foreground">Общий уровень</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Target" size={32} className="mx-auto mb-2 text-secondary" />
                <div className="text-3xl font-bold font-orbitron">{stats.totalQuestsCompleted}</div>
                <div className="text-sm text-muted-foreground">Выполнено квестов</div>
              </Card>
              <Card className="p-6 text-center glow-box">
                <Icon name="Zap" size={32} className="mx-auto mb-2 text-accent" />
                <div className="text-3xl font-bold font-orbitron">{stats.totalXP}</div>
                <div className="text-sm text-muted-foreground">Всего опыта</div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-orbitron font-bold mb-4">Прогресс по навыкам</h3>
              <div className="space-y-4">
                {Object.entries(stats.skills)
                  .sort((a, b) => b[1].xp - a[1].xp)
                  .map(([skill, data]) => (
                    <div key={skill} className="flex items-center gap-4">
                      <Icon 
                        name={SKILL_ICONS[skill as SkillType]} 
                        size={24} 
                        className={SKILL_COLORS[skill as SkillType]} 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{skill}</span>
                          <span className="text-muted-foreground">Lvl {data.level} • {data.xp} XP</span>
                        </div>
                        <Progress value={(data.xp / Math.max(...Object.values(stats.skills).map(s => s.xp))) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <div className="text-center">
                <Icon name="Star" size={48} className="mx-auto mb-3 text-primary animate-glow-pulse" />
                <h3 className="text-2xl font-orbitron font-bold mb-2">Отличная работа!</h3>
                <p className="text-muted-foreground">
                  Продолжай выполнять ежедневные квесты, чтобы развивать своего персонажа и достигать новых высот! 🚀
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
