import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Workspaces Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Workspaces page allows you to manage your workspaces and switch between them. This feature is powered by Clerk Organizations, which enables multi-tenant workspace management. You can view all available workspaces, create new ones, and switch your active workspace.',
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Creating Workspaces',
      description:
        'To create a new workspace, click the "Create Organization" button. You will be prompted to enter a workspace name and configure initial settings. Once created, you can switch to the new workspace and start managing it.',
      links: [
        {
          title: 'Multi-tenant Authentication Guide',
          url: 'https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk'
        }
      ]
    },
    {
      title: 'Switching Workspaces',
      description:
        'You can switch between workspaces by clicking on a workspace in the list. The selected workspace becomes your active organization context, and all organization-specific features will use this workspace.',
      links: []
    },
    {
      title: 'Workspace Features',
      description:
        'Each workspace operates independently with its own team members, roles, permissions, and billing. This allows you to manage multiple projects or teams within a single account while keeping their data and settings separate.',
      links: []
    },
    {
      title: 'Server-Side Permission Checks',
      description:
        "This application follows Clerk's recommended patterns for multi-tenant authentication. Server-side permission checks ensure that users can only access resources for their active organization.",
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    }
  ]
};

export const searchInfoContentEs: InfobarContent = {
  title: 'Búsqueda de Documentos',
  sections: [
    {
      title: 'Descripción General',
      description:
        'La página de Búsqueda te permite consultar y filtrar documentos de manera rápida y eficiente. Utiliza los filtros disponibles para encontrar documentos específicos por fecha, clasificación, subclasificación y área. La búsqueda incluye paginación, ordenamiento y capacidades de filtrado del lado del servidor.',
      links: []
    },
    {
      title: 'Filtros de Búsqueda',
      description:
        'Usa la barra de herramientas para filtrar documentos por diferentes criterios: clasificación (muestras, procesos de remediación, reportes, etc.), subclasificación, área del sitio (A, B, C) y rango de fechas. Los resultados se actualizan automáticamente según tus selecciones.',
      links: []
    },
    {
      title: 'Resultados',
      description:
        'La tabla de resultados muestra los documentos que coinciden con tus criterios de búsqueda. Puedes ordenar las columnas haciendo clic en los encabezados y navegar entre páginas para explorar todos los resultados encontrados.',
      links: []
    },
    {
      title: 'Carga de Documentos',
      description:
        'Para cargar nuevos documentos al sistema, dirígete al Explorador de Documentos. Allí podrás subir uno o más archivos simultáneamente, asignándoles la fecha, clasificación, subclasificación y área correspondiente.',
      links: [
        {
          title: 'Ir al Explorador',
          url: '/dashboard/explorer'
        }
      ]
    }
  ]
};

export const searchInfoContentEn: InfobarContent = {
  title: 'Document Search',
  sections: [
    {
      title: 'Overview',
      description:
        'The Search page allows you to query and filter documents quickly and efficiently. Use the available filters to find specific documents by date, classification, subclassification, and area. Search includes pagination, sorting, and server-side filtering capabilities.',
      links: []
    },
    {
      title: 'Search Filters',
      description:
        'Use the toolbar to filter documents by different criteria: classification (samples, remediation processes, reports, etc.), subclassification, site area (A, B, C), and date range. Results update automatically based on your selections.',
      links: []
    },
    {
      title: 'Results',
      description:
        'The results table displays documents matching your search criteria. You can sort columns by clicking on headers and navigate through pages to explore all found results.',
      links: []
    },
    {
      title: 'Document Upload',
      description:
        'To upload new documents to the system, go to the Document Explorer. There you can upload one or more files simultaneously, assigning them the corresponding date, classification, subclassification, and area.',
      links: [
        {
          title: 'Go to Explorer',
          url: '/dashboard/explorer'
        }
      ]
    }
  ]
};

export const explorerInfoContentEs: InfobarContent = {
  title: 'Explorador de Documentos',
  sections: [
    {
      title: 'Descripción General',
      description:
        'El Explorador de Documentos es una herramienta sencilla y eficaz que te permite navegar y gestionar tus archivos de manera organizada. Puedes explorar tus documentos organizados por año, mes, clasificación y subclasificación.',
      links: []
    },
    {
      title: 'Navegación por Documentos',
      description:
        'Puedes explorar tus documentos organizados por año, mes, clasificación y subclasificación. Esto facilita encontrar rápidamente el archivo que necesitas.',
      links: []
    },
    {
      title: 'Interacción con Documentos',
      description:
        'Además de navegar, puedes interactuar con los documentos. Esto incluye la posibilidad de previsualizar (PDFs e imágenes), descargar y eliminar archivos según tus necesidades. Eliminar un archivo es irreversible y no puede ser deshecho.',
      links: []
    },
    {
      title: 'Carga de Documentos',
      description:
        'Puedes cargar documentos en el Explorador haciendo clic en el botón "Cargar" en la parte superior. Esto te llevará a la página de carga donde podrás subir uno o más archivos simultáneamente.',
      links: [
        {
          title: 'Cargar Documentos',
          url: '/dashboard/explorer/upload'
        }
      ]
    }
  ]
};

export const explorerInfoContentEn: InfobarContent = {
  title: 'Document Explorer',
  sections: [
    {
      title: 'Overview',
      description:
        'The Document Explorer is a simple and effective tool that allows you to navigate and manage your files in an organized manner. You can explore your documents organized by year, month, classification and subclassification.',
      links: []
    },
    {
      title: 'Document Navigation',
      description:
        'You can explore your documents organized by year, month, classification and subclassification. This makes it easy to quickly find the file you need.',
      links: []
    },
    {
      title: 'Document Interaction',
      description:
        'In addition to navigating, you can interact with documents. This includes the ability to preview (PDFs and images), download and delete files according to your needs. Deleting a file is irreversible and cannot be undone.',
      links: []
    },
    {
      title: 'Document Upload',
      description:
        'You can upload documents to the Explorer by clicking the "Upload" button at the top. This will take you to the upload page where you can upload one or more files simultaneously.',
      links: [
        {
          title: 'Upload Documents',
          url: '/dashboard/explorer/upload'
        }
      ]
    }
  ]
};

export const uploadInfoContentEs: InfobarContent = {
  title: 'Carga de Documentos',
  sections: [
    {
      title: 'Descripción General',
      description:
        'La funcionalidad de carga de documentos te permite subir uno o más documentos al sistema de manera simultánea. Esta herramienta es esencial para mantener tus archivos organizados y accesibles.',
      links: []
    },
    {
      title: 'Fecha del Documento',
      description:
        'Selecciona la fecha correspondiente al documento. Esto ayudará a organizar los documentos cronológicamente.',
      links: []
    },
    {
      title: 'Clasificación y Subclasificación',
      description:
        'La clasificación es MUY importante. Es el criterio principal que se utilizará para ordenar los documentos y su metadata. Cada clasificación tiene sus propias subclasificaciones específicas. Asegúrate de elegir la combinación correcta para que los documentos puedan ser encontrados fácilmente más adelante.',
      links: []
    },
    {
      title: 'Área',
      description:
        'El área se refiere a la zona específica del sitio de Berazategui a la que pertenece el documento. Las áreas disponibles son: Area A, Area B y Area C. Selecciona el área que corresponda al documento para facilitar su búsqueda posterior.',
      links: []
    },
    {
      title: 'Volver al Explorador',
      description:
        'Una vez cargados los documentos, puedes volver al Explorador para visualizarlos y gestionarlos.',
      links: [
        {
          title: 'Ir al Explorador',
          url: '/dashboard/explorer'
        }
      ]
    }
  ]
};

export const uploadInfoContentEn: InfobarContent = {
  title: 'Document Upload',
  sections: [
    {
      title: 'Overview',
      description:
        'The document upload functionality allows you to upload one or more documents to the system simultaneously. This tool is essential for keeping your files organized and accessible.',
      links: []
    },
    {
      title: 'Document Date',
      description:
        'Select the date corresponding to the document. This will help organize documents chronologically.',
      links: []
    },
    {
      title: 'Classification and Subclassification',
      description:
        'Classification is VERY important. It is the main criterion that will be used to sort documents and their metadata. Each classification has its own specific subclassifications. Make sure to choose the correct combination so that documents can be easily found later.',
      links: []
    },
    {
      title: 'Area',
      description:
        'The area refers to the specific zone of the Berazategui site to which the document belongs. The available areas are: Area A, Area B and Area C. Select the area that corresponds to the document to facilitate its subsequent search.',
      links: []
    },
    {
      title: 'Back to Explorer',
      description:
        'Once documents are uploaded, you can return to the Explorer to view and manage them.',
      links: [
        {
          title: 'Go to Explorer',
          url: '/dashboard/explorer'
        }
      ]
    }
  ]
};

export const generalInfoContentEs: InfobarContent = {
  title: 'Análisis General',
  sections: [
    {
      title: 'Descripción General',
      description:
        'El dashboard general es una herramienta que proporciona una vista rápida y simplificada de las concentraciones de tetracloruro de carbono y cloroformo. Está diseñado para mostrar los indicadores más importantes y la evolución temporal de estas sustancias.',
      links: []
    },
    {
      title: 'Filtros',
      description:
        'En la parte superior del dashboard encontrarás una barra de filtros que te permite personalizar la visualización: fecha desde/hasta, tipo de pozo (pozos de monitoreo o bombas de agua), área, pozo específico y tipo de muestra (Agua/Suelo).',
      links: []
    },
    {
      title: 'Gráfico de Concentración Promedio',
      description:
        'La sección principal muestra un gráfico de línea temporal para cada sustancia que incluye la evolución de las concentraciones promedio a lo largo del tiempo y una línea punteada que indica el nivel guía. Al pasar el cursor sobre los puntos se muestra el valor exacto de la concentración.',
      links: []
    },
    {
      title: 'Métricas por Sustancia',
      description:
        'Para cada sustancia se muestran los siguientes indicadores clave: muestras (número total de mediciones), nivel de guía, media, mínimo y máximo. Los valores se muestran en verde cuando están por debajo del nivel guía y en rojo cuando lo superan.',
      links: []
    },
    {
      title: 'Tabla de Pozos Principales',
      description:
        'Se muestra una tabla con los tres pozos que presentan las concentraciones promedio más altas, incluyendo nombre del pozo, concentración promedio y fechas de primera y última muestra.',
      links: []
    },
    {
      title: 'Visualización en Mapa',
      description:
        'Al hacer clic en "Ver en mapa" se abre un diálogo que muestra la distribución espacial de las concentraciones con múltiples capas y opciones de visualización.',
      links: []
    }
  ]
};

export const generalInfoContentEn: InfobarContent = {
  title: 'General Analysis',
  sections: [
    {
      title: 'Overview',
      description:
        'The general dashboard is a tool that provides a quick and simplified view of carbon tetrachloride and chloroform concentrations. It is designed to show the most important indicators and the temporal evolution of these substances.',
      links: []
    },
    {
      title: 'Filters',
      description:
        'At the top of the dashboard you will find a filter bar that allows you to customize the visualization: date from/to, well type (monitoring wells or water pumps), area, specific well and sample type (Water/Soil).',
      links: []
    },
    {
      title: 'Average Concentration Chart',
      description:
        'The main section shows a temporal line chart for each substance that includes the evolution of average concentrations over time and a dotted line indicating the guideline level. Hovering over points shows the exact concentration value.',
      links: []
    },
    {
      title: 'Metrics by Substance',
      description:
        'For each substance the following key indicators are shown: samples (total number of measurements), guideline level, mean, minimum and maximum. Values are shown in green when they are below the guideline level and in red when they exceed it.',
      links: []
    },
    {
      title: 'Main Wells Table',
      description:
        'A table is shown with the three wells that present the highest average concentrations, including well name, average concentration and dates of first and last sample.',
      links: []
    },
    {
      title: 'Map Visualization',
      description:
        'Clicking on "View on map" opens a dialog that shows the spatial distribution of concentrations with multiple layers and visualization options.',
      links: []
    }
  ]
};

export const substanceInfoContentEs: InfobarContent = {
  title: 'Análisis de Concentraciones',
  sections: [
    {
      title: 'Descripción General',
      description:
        'El dashboard es una herramienta interactiva diseñada para visualizar y analizar datos de monitoreo ambiental. Permite explorar las concentraciones de diferentes sustancias en distintas ubicaciones y períodos de tiempo, facilitando la identificación de tendencias y valores atípicos.',
      links: []
    },
    {
      title: 'Filtros',
      description:
        'En la parte superior del dashboard encontrarás una barra de filtros que te permite personalizar la visualización: fecha desde/hasta, sustancia específica, tipo de pozo (pozos de monitoreo o bombas de agua), área, pozo específico y tipo de muestra (Agua/Suelo).',
      links: []
    },
    {
      title: 'Métricas Descriptivas',
      description:
        'La primera columna de indicadores muestra las estadísticas clave: muestras (número total de mediciones), media (promedio de todas las concentraciones), mediana (valor central no afectado por valores extremos), mínimo, máximo y desviación estándar (medida de dispersión de los datos).',
      links: []
    },
    {
      title: 'Métricas de Variación',
      description:
        'La segunda columna muestra: nivel guía (valor de referencia), variación de la última media respecto al nivel guía (porcentaje de desviación) y variación de la última media respecto al máximo promedio histórico (porcentaje de desviación).',
      links: []
    },
    {
      title: 'Gráfico de Concentración Promedio',
      description:
        'Este gráfico de línea temporal muestra la evolución de las concentraciones promedio a lo largo del tiempo y una línea punteada que indica el nivel guía. Permite identificar tendencias y patrones temporales.',
      links: []
    },
    {
      title: 'Gráfico de Boxplot',
      description:
        'Este gráfico muestra la distribución de las concentraciones por año. La línea dentro de la caja es la mediana, los límites de la caja representan Q1 (25%) y Q3 (75%), y los bigotes muestran el rango de valores típicos. Los puntos individuales representan valores atípicos.',
      links: []
    },
    {
      title: 'Mapa',
      description:
        'El mapa sirve para ver geográficamente los pozos y las concentraciones. Es interactivo y tiene distintas capas: concentraciones por burbujas (el tamaño indica la concentración promedio, rojo si supera el nivel guía), marcadores y polígonos del sitio. También se pueden cambiar los estilos del mapa, por ejemplo, a satélite.',
      links: []
    }
  ]
};

export const substanceInfoContentEn: InfobarContent = {
  title: 'Concentration Analysis',
  sections: [
    {
      title: 'Overview',
      description:
        'The dashboard is an interactive tool designed to visualize and analyze environmental monitoring data. It allows exploring concentrations of different substances in various locations and time periods, facilitating the identification of trends and outliers.',
      links: []
    },
    {
      title: 'Filters',
      description:
        'At the top of the dashboard you will find a filter bar that allows you to customize the visualization: date from/to, specific substance, well type (monitoring wells or water pumps), area, specific well and sample type (Water/Soil).',
      links: []
    },
    {
      title: 'Descriptive Metrics',
      description:
        'The first column of indicators shows key statistics: samples (total number of measurements), mean (average of all concentrations), median (central value not affected by extreme values), minimum, maximum and standard deviation (measure of data dispersion).',
      links: []
    },
    {
      title: 'Variation Metrics',
      description:
        'The second column shows: guideline level (reference value), last mean variation relative to guideline level (deviation percentage) and last mean variation relative to historical maximum average (deviation percentage).',
      links: []
    },
    {
      title: 'Average Concentration Chart',
      description:
        'This temporal line chart shows the evolution of average concentrations over time and a dotted line indicating the guideline level. It allows identifying trends and temporal patterns.',
      links: []
    },
    {
      title: 'Boxplot Chart',
      description:
        'This chart shows the distribution of concentrations by year. The line inside the box is the median, the box limits represent Q1 (25%) and Q3 (75%), and the whiskers show the range of typical values. Individual points represent outliers.',
      links: []
    },
    {
      title: 'Map',
      description:
        'The map serves to geographically view wells and concentrations. It is interactive and has different layers: concentrations by bubbles (size indicates average concentration, red if exceeds guideline level), markers and site polygons. You can also change the map styles, for example, to satellite.',
      links: []
    }
  ]
};

export const reportsListInfoContentEs: InfobarContent = {
  title: 'Historial de Reportes',
  sections: [
    {
      title: 'Descripción General',
      description:
        'Esta página muestra el historial completo de reportes generados. Aquí puedes consultar todos los reportes creados por los distintos usuarios del workspace, junto con su nombre, fecha de generación, rango de fechas utilizado y el usuario que lo generó.',
      links: []
    },
    {
      title: 'Columnas de la Tabla',
      description:
        'La tabla incluye las siguientes columnas: Nombre (identificador del reporte o ZIP), Generado (fecha relativa de creación), Rango (período de fechas que cubre el reporte), Usuario (quién lo generó) y Acción (enlace de descarga directa del archivo).',
      links: []
    },
    {
      title: 'Descarga de Reportes',
      description:
        'Puedes descargar cualquier reporte previamente generado haciendo clic en el enlace de la columna Acción. Esto es útil para recuperar reportes sin necesidad de regenerarlos.',
      links: []
    },
    {
      title: 'Generar un Nuevo Reporte',
      description:
        'Para crear un nuevo reporte, haz clic en el botón "Nuevo reporte" en la parte superior o usa el enlace a continuación.',
      links: [
        {
          title: 'Ir a Generar Reporte',
          url: '/dashboard/reports/new'
        }
      ]
    }
  ]
};

export const reportsListInfoContentEn: InfobarContent = {
  title: 'Report History',
  sections: [
    {
      title: 'Overview',
      description:
        'This page displays the full history of generated reports. Here you can review all reports created by the different users in the workspace, including the report name, generation date, date range used, and the user who generated it.',
      links: []
    },
    {
      title: 'Table Columns',
      description:
        'The table includes the following columns: Name (report or ZIP identifier), Generated (relative creation date), Range (date period covered by the report), User (who generated it) and Action (direct download link for the file).',
      links: []
    },
    {
      title: 'Downloading Reports',
      description:
        'You can download any previously generated report by clicking the link in the Action column. This is useful for retrieving reports without needing to regenerate them.',
      links: []
    },
    {
      title: 'Generate a New Report',
      description:
        'To create a new report, click the "New report" button at the top or use the link below.',
      links: [
        {
          title: 'Go to Report Generator',
          url: '/dashboard/reports/new'
        }
      ]
    }
  ]
};

export const reportsGeneratorInfoContentEs: InfobarContent = {
  title: 'Generador de Reportes',
  sections: [
    {
      title: 'Descripción General',
      description:
        'El Generador de Reportes permite crear uno o más reportes de datos ambientales en una sola operación. Define un rango de fechas global, agrega los reportes que necesites y genera todo con un clic. Si seleccionas más de un reporte, el sistema descarga un archivo ZIP con todos los archivos incluidos.',
      links: []
    },
    {
      title: 'Filtros Globales',
      description:
        'En la parte superior se configuran la fecha desde y la fecha hasta. Estas fechas aplican a todos los reportes que agregues. Asegúrate de definirlas antes de agregar reportes.',
      links: []
    },
    {
      title: 'Tarjetas de Reporte',
      description:
        'Cada reporte se representa como una tarjeta individual. En cada tarjeta puedes: elegir el tipo de reporte (profundidad de pozo, parámetros de muestreo, concentraciones, etc.), editar el nombre del reporte (se genera automáticamente pero es editable), y configurar filtros específicos como la selección de pozos, según el tipo elegido.',
      links: []
    },
    {
      title: 'Presets',
      description:
        'Un preset es una plantilla prearmada que agrega múltiples tipos de reporte de una sola vez con configuración inicial. En lugar de agregar reportes uno por uno, puedes seleccionar un preset desde el menú desplegable junto al botón "Agregar reporte". Los presets disponibles actualmente son: "Formulario 6 Provincia BA" (incluye profundidad de pozo, parámetros de muestreo, concentraciones y avance tareas de remediación) y "Reportes para CIG" (incluye parámetros de muestreo CIG, concentraciones volátiles CIG y concentraciones inorgánicas CIG). Después de aplicar un preset, puedes seguir editando cada tarjeta individualmente.',
      links: []
    },
    {
      title: 'Nombre del Archivo y Descarga',
      description:
        'En la barra inferior puedes editar el nombre del archivo final. Si generas un solo reporte, se descarga ese archivo directamente. Si generas dos o más, el sistema empaqueta todos en un único archivo ZIP con el nombre que hayas definido. Haz clic en "Generar Todo" para iniciar la descarga.',
      links: []
    },
    {
      title: 'Volver al Listado',
      description:
        'Una vez generados los reportes, puedes volver al historial para verlos registrados.',
      links: [
        {
          title: 'Ir al Historial de Reportes',
          url: '/dashboard/reports'
        }
      ]
    }
  ]
};

export const reportsGeneratorInfoContentEn: InfobarContent = {
  title: 'Report Generator',
  sections: [
    {
      title: 'Overview',
      description:
        'The Report Generator allows you to create one or more environmental data reports in a single operation. Define a global date range, add the reports you need, and generate everything with one click. If you select more than one report, the system downloads a ZIP file containing all included files.',
      links: []
    },
    {
      title: 'Global Filters',
      description:
        'At the top, set the date from and date to. These dates apply to all reports you add. Make sure to define them before adding reports.',
      links: []
    },
    {
      title: 'Report Cards',
      description:
        'Each report is represented as an individual card. On each card you can: choose the report type (well depth, sampling parameters, concentrations, etc.), edit the report name (auto-generated but editable), and configure specific filters such as well selection, depending on the chosen type.',
      links: []
    },
    {
      title: 'Presets',
      description:
        'A preset is a pre-built template that adds multiple report types at once with initial configuration. Instead of adding reports one by one, you can select a preset from the dropdown menu next to the "Add report" button. Currently available presets are: "Formulario 6 Provincia BA" (includes well depth, sampling parameters, concentrations, and remediation task progress) and "Reportes para CIG" (includes CIG sampling parameters, CIG volatile concentrations, and CIG inorganic concentrations). After applying a preset, you can continue editing each card individually.',
      links: []
    },
    {
      title: 'File Name and Download',
      description:
        'In the bottom bar you can edit the final file name. If you generate a single report, that file is downloaded directly. If you generate two or more, the system packages them all into a single ZIP file with the name you defined. Click "Generate All" to start the download.',
      links: []
    },
    {
      title: 'Back to History',
      description:
        'Once reports are generated, you can return to the history to see them recorded.',
      links: [
        {
          title: 'Go to Report History',
          url: '/dashboard/reports'
        }
      ]
    }
  ]
};
