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
    navigate(`/project/${newId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo height={36} />
            
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={createNewProject}
              >
                Create new project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">
              My Projects
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {projects.length === 0 ? 'No projects yet' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
            </p>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </Button>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-red-100 mx-auto flex items-center justify-center mb-6">
                <Plus size={40} className="text-brand-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-3">
                No projects yet
              </h2>
              <p className="text-text-secondary mb-6">
                Create your first project to start designing with AI-powered tools
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={createNewProject}
              >
                Create your first project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              onClick={createNewProject}
              className="aspect-[4/3] bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-primary hover:bg-red-50 transition-all flex items-center justify-center group"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-brand-primary mx-auto flex items-center justify-center mb-3 transition-colors">
                  <Plus
                    size={24}
                    className="text-gray-400 group-hover:text-white transition-colors"
                  />
                </div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-brand-primary transition-colors">
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
