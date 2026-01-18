'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationList } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Project, Country, Site } from '@/constants/data';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAvailableTenants } from '../data/get-available-tenants';
import { resolveActionResult } from '@/lib/actions/client';

export function TenantSelector() {
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true
    }
  });

  useEffect(() => {
    if (isLoaded && setActive) {
      void setActive({ organization: null });
    }
  }, [isLoaded, setActive]);

  const { data: availableTenants, isLoading: isLoadingAvailableTenants } =
    useQuery({
      queryKey: ['available-tenants'],
      queryFn: () => resolveActionResult(getAvailableTenants())
    });

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = useMemo<Country[]>(() => {
    if (!availableTenants) return [];

    return Array.from(
      new Map(
        availableTenants.map((project) => [
          project.countryId,
          project.countryLabel
        ])
      ).entries()
    ).map(([id, label]) => ({ id, label }));
  }, [availableTenants]);

  const filteredSites = useMemo<Site[]>(() => {
    if (!availableTenants || !selectedCountry) return [];

    const sitesMap = new Map<
      string,
      { id: string; label: string; countryId: string }
    >();

    availableTenants
      .filter((project) => project.countryId === selectedCountry)
      .forEach((project) => {
        const key = `${project.countryId}-${project.siteId}`;
        if (!sitesMap.has(key)) {
          sitesMap.set(key, {
            id: project.siteId,
            label: project.siteLabel,
            countryId: project.countryId
          });
        }
      });

    return Array.from(sitesMap.values());
  }, [availableTenants, selectedCountry]);

  const filteredProjects = useMemo<Project[]>(() => {
    if (!availableTenants || !selectedCountry || !selectedSite) return [];

    return availableTenants.filter(
      (project) =>
        project.countryId === selectedCountry && project.siteId === selectedSite
    );
  }, [availableTenants, selectedCountry, selectedSite]);

  const selectedProjectData = useMemo<Project | undefined>(() => {
    if (!selectedProject || !availableTenants) return undefined;
    return availableTenants.find((project) => project.id === selectedProject);
  }, [selectedProject, availableTenants]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedSite('');
    setSelectedProject('');
    setError(null);
  };

  const handleSiteChange = (value: string) => {
    setSelectedSite(value);
    setSelectedProject('');
    setError(null);
  };

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedProjectData || !setActive) {
      setError('Por favor selecciona todas las opciones');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await setActive({ organization: selectedProjectData.clerkOrgId });
      router.push('/dashboard');
    } catch (err) {
      console.error('Error al setear la organización:', err);
      setError(
        'No se pudo acceder a este proyecto. Verifica que tengas permisos.'
      );
      setIsSubmitting(false);
    }
  };

  const isFormComplete =
    selectedCountry && selectedSite && selectedProject && isLoaded;

  if (isLoadingAvailableTenants) {
    return (
      <Card className='w-full max-w-md'>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  if (!availableTenants || availableTenants.length === 0) {
    return (
      <Card className='w-full max-w-md'>
        <CardContent className='p-8'>
          <p className='text-muted-foreground text-center text-sm'>
            No tienes acceso a ningún proyecto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>Seleccionar Proyecto</CardTitle>
        <CardDescription>
          Elige el país, sitio y proyecto para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>País</label>
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            disabled={isSubmitting}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Seleccionar país' />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Sitio</label>
          <Select
            value={selectedSite}
            onValueChange={handleSiteChange}
            disabled={!selectedCountry || isSubmitting}
          >
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  selectedCountry
                    ? 'Seleccionar sitio'
                    : 'Primero selecciona un país'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredSites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Proyecto</label>
          <Select
            value={selectedProject}
            onValueChange={handleProjectChange}
            disabled={!selectedSite || isSubmitting}
          >
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  selectedSite
                    ? 'Seleccionar proyecto'
                    : 'Primero selecciona un sitio'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className='text-destructive text-center text-sm'>{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isFormComplete || isSubmitting}
          className='w-full'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Accediendo...
            </>
          ) : (
            'Continuar'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
