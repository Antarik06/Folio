'use client'

import React from 'react'
import { Check } from 'lucide-react'

export type WizardStep = 'preview' | 'configure' | 'shipping' | 'review'

interface StepIndicatorProps {
  currentStep: WizardStep
  completedSteps: WizardStep[]
}

const STEPS: { key: WizardStep; label: string; shortLabel: string }[] = [
  { key: 'preview', label: 'Preview', shortLabel: 'Preview' },
  { key: 'configure', label: 'Configure', shortLabel: 'Config' },
  { key: 'shipping', label: 'Shipping', shortLabel: 'Ship' },
  { key: 'review', label: 'Review & Order', shortLabel: 'Order' },
]

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="w-full" role="navigation" aria-label="Order progress">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key)
          const isCurrent = currentStep === step.key
          const isPast = index < currentIndex

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                {/* Circle */}
                <div
                  className={`
                    relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${
                      isCompleted || isPast
                        ? 'bg-secondary text-secondary-foreground'
                        : isCurrent
                          ? 'border-2 border-primary bg-card text-primary step-indicator-active'
                          : 'border-2 border-linen bg-card text-muted-foreground'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs tracking-wide transition-colors duration-300 ${
                    isCurrent
                      ? 'text-foreground font-medium'
                      : isCompleted || isPast
                        ? 'text-secondary font-medium'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 max-w-[80px] h-[2px] mx-1 -mt-6 relative">
                  <div className="absolute inset-0 bg-linen rounded-full" />
                  <div
                    className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: index < currentIndex ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile: compact version */}
      <div className="sm:hidden flex items-center justify-between px-2">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key)
          const isCurrent = currentStep === step.key
          const isPast = index < currentIndex

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
                    ${
                      isCompleted || isPast
                        ? 'bg-secondary text-secondary-foreground'
                        : isCurrent
                          ? 'border-2 border-primary bg-card text-primary step-indicator-active'
                          : 'border border-linen bg-card text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-wider uppercase ${
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-1 h-[1.5px] mx-1 -mt-4 relative">
                  <div className="absolute inset-0 bg-linen rounded-full" />
                  <div
                    className="absolute inset-y-0 left-0 bg-secondary rounded-full transition-all duration-500"
                    style={{ width: index < currentIndex ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
