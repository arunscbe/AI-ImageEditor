import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Grid, List } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');

  const projects = [];

  const createNewProject = () => {
    const newId = Date.now().toString();
    navigate(`/project/${newId}/intent`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo height={32} />
            
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={createNewProject}
              >
                Create new project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              My Projects
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 font-sans">
              {projects.length === 0 ? 'No projects yet' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
            </p>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-50 to-red-100 mx-auto flex items-center justify-center mb-5">
                <Plus size={36} className="text-brand-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                No projects yet
              </h2>
              <p className="text-gray-600 mb-5 font-sans text-sm">
                Create your first project to start designing with AI-powered tools
              </p>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={createNewProject}
              >
                Create your first project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <button
              onClick={createNewProject}
              className="aspect-[4/3] bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-red-50 transition-all duration-150 flex items-center justify-center group"
            >
              <div className="text-center">
                <div className="w-11 h-11 rounded-lg bg-gray-100 group-hover:bg-brand-primary mx-auto flex items-center justify-center mb-2.5 transition-colors duration-150">
                  <Plus
                    size={22}
                    className="text-gray-400 group-hover:text-white transition-colors"
                  />
                </div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-brand-primary transition-colors font-sans">
                  Create new project
                </p>
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectsPage;
