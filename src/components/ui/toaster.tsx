import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={2800}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive";
        return (
          <Toast key={id} variant={variant} {...props} className="group">
            <div className="flex items-start gap-3 w-full pe-6 text-start" dir="auto">
              <div className="shrink-0 mt-0.5">
                {isDestructive ? (
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-rose-600 dark:text-rose-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
