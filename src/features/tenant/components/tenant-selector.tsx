'use client';

import { useState, useEffect } from 'react';
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
import { COUNTRIES, SITES, PROJECTS } from '@/constants/data';
import { Loader2 } from 'lucide-react';

export function TenantSelector() {
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList();

  // Resetear la organización activa al montar el componente
  // para forzar al usuario a seleccionar una nueva
  useEffect(() => {
    if (isLoaded && setActive) {
      void setActive({ organization: null });
    }
  }, [isLoaded, setActive]);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar sitios basados en el país seleccionado
  const filteredSites = SITES.filter(
    (site) => site.countryId === selectedCountry
  );

  // Filtrar proyectos basados en el sitio seleccionado
  const filteredProjects = PROJECTS.filter(
    (project) => project.siteId === selectedSite
  );

  // Obtener el proyecto seleccionado para conseguir el clerkOrgId
  const selectedProjectData = PROJECTS.find(
    (project) => project.id === selectedProject
  );

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
              {COUNTRIES.map((country) => (
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
