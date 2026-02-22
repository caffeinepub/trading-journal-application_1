import { AchievementBadge as AchievementBadgeType, AchievementBadgeStatus } from '../types';
import { Trophy, Target, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AchievementBadgeProps {
  badge: AchievementBadgeType;
  size?: 'sm' | 'md' | 'lg';
}

export default function AchievementBadge({ badge, size = 'md' }: AchievementBadgeProps) {
  const getStatusConfig = (status: AchievementBadgeStatus) => {
    if (status === AchievementBadgeStatus.targetReached) {
      return {
        icon: Target,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        badgeVariant: 'default' as const,
        image: '/assets/generated/target-reached-badge.dim_48x48.png',
      };
    } else if (status === AchievementBadgeStatus.goalAchieved) {
      return {
        icon: Trophy,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        badgeVariant: 'secondary' as const,
        image: '/assets/generated/achievement-trophy.dim_64x64.png',
      };
    } else {
      // milestone or any other status
      return {
        icon: Star,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        badgeVariant: 'outline' as const,
        image: '/assets/generated/milestone-star.dim_32x32.png',
      };
    }
  };

  const config = getStatusConfig(badge.status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      card: 'p-3',
      icon: 'h-8 w-8',
      image: 'h-8 w-8',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      card: 'p-4',
      icon: 'h-10 w-10',
      image: 'h-10 w-10',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      card: 'p-6',
      icon: 'h-12 w-12',
      image: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <Card className={`${config.borderColor} ${config.bgColor} border-2 transition-all hover:shadow-lg`}>
      <CardContent className={classes.card}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 rounded-full ${config.bgColor} p-2`}>
            {badge.status === AchievementBadgeStatus.goalAchieved ? (
              <img src={config.image} alt="Achievement" className={classes.image} />
            ) : (
              <Icon className={`${classes.icon} ${config.color}`} />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold ${config.color} ${classes.title}`}>{badge.title}</h4>
              <Badge variant={config.badgeVariant} className="text-xs">
                {badge.status === AchievementBadgeStatus.targetReached && 'Target'}
                {badge.status === AchievementBadgeStatus.goalAchieved && 'Achievement'}
                {badge.status === AchievementBadgeStatus.milestone && 'Milestone'}
              </Badge>
            </div>
            <p className={`text-muted-foreground ${classes.description}`}>{badge.description}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(Number(badge.timestamp) / 1000000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
