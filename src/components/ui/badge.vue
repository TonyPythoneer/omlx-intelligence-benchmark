<script setup lang="ts">
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        new: 'border-transparent bg-blue-100 text-blue-700',
        overwrite: 'border-transparent bg-amber-100 text-amber-700',
        'score-green': 'border-transparent bg-green-100 text-green-700',
        'score-amber': 'border-transparent bg-amber-100 text-amber-800',
        'score-red': 'border-transparent bg-red-100 text-red-700',
        'tier-opus': 'border-transparent bg-violet-100 text-violet-700',
        'tier-sonnet': 'border-transparent bg-blue-100 text-blue-700',
        'tier-haiku': 'border-transparent bg-emerald-100 text-emerald-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

interface Props {
  variant?: BadgeVariants['variant'];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
