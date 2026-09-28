/**
 * useServices.ts — React Query hooks for services
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, type ServiceCard, type ServiceDetail } from "@/data/servicesApi";
import { toast } from "@/hooks/use-toast";

const KEYS = {
  list: ["services", "list"] as const,
  listAll: ["services", "list-all"] as const,
  detail: (slug: string) => ["services", "detail", slug] as const,
};

/** Public: list active services for ServicesMap */
export function useServicesList() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () => servicesApi.list(),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
  });
}

/** Public: service detail for ServicePage */
export function useServiceDetail(slug: string) {
  return useQuery({
    queryKey: KEYS.detail(slug),
    queryFn: () => servicesApi.get(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

/** Admin: list all services (including inactive) */
export function useServicesListAll() {
  return useQuery({
    queryKey: KEYS.listAll,
    queryFn: () => servicesApi.listAll(),
    staleTime: 0, // always fresh in admin
  });
}

/** Admin: upsert mutation */
export function useServiceUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ServiceDetail> & { slug: string }) =>
      servicesApi.upsert(data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.listAll });
      qc.setQueryData(KEYS.detail(saved.slug), saved);
      toast({ title: " تم الحفظ بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: " خطأ في الحفظ", description: err.message, variant: "destructive" });
    },
  });
}

/** Admin: toggle active */
export function useServiceToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      servicesApi.setActive(slug, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.listAll });
    },
    onError: (err: Error) => {
      toast({ title: " خطأ", description: err.message, variant: "destructive" });
    },
  });
}

/** Admin: delete */
export function useServiceDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => servicesApi.delete(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.listAll });
      toast({ title: " تم الحذف" });
    },
    onError: (err: Error) => {
      toast({ title: " خطأ في الحذف", description: err.message, variant: "destructive" });
    },
  });
}
