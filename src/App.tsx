import React, { useState, useEffect } from 'react';
import PipelineVisual from './components/PipelineVisual';
import OutputPanel from './components/OutputPanel';
import ChatInterface from './components/ChatInterface';
import { PipelineStep } from './types';
import { Play, Settings, User, Bell } from 'lucide-react';

function App() {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<PipelineStep | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repoName, setRepoName] = useState('');

  useEffect(() => {
    // Fetch initial steps
    fetchSteps();
    
    // Setup WebSocket connection
    const websocket = new WebSocket('ws://localhost:8000/ws');
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'step_update') {
        updateStep(data.data);
      }
    };
    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const fetchSteps = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/pipeline/steps');
      const data = await response.json();
      setSteps(data.steps);
      if (data.steps.length > 0) {
        setSelectedStep(data.steps[0]);
      }
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const updateStep = (updatedStep: PipelineStep) => {
    setSteps(prev => prev.map(step => 
      step.id === updatedStep.id ? updatedStep : step
    ));
    
    if (selectedStep && selectedStep.id === updatedStep.id) {
      setSelectedStep(updatedStep);
    }
  };

  const startPipeline = async () => {
    try {
      setIsRunning(true);
      console.log('Starting pipeline with:', { owner, repoName });
      const response = await fetch('http://localhost:8000/api/pipeline/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: owner,
          repo_name: repoName
        }),
      });
      console.log('Pipeline start response status:', response.status);
      const data = await response.json();
      console.log('Pipeline start response data:', data);
    } catch (error) {
      console.error('Error starting pipeline:', error);
      setIsRunning(false);
    }
  };

  // Parse owner and repo name from URL
  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRepoUrl(url);
    // Try to parse GitHub repo URL
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+)(?:\.git)?/i);
    if (match) {
      setOwner(match[1]);
      setRepoName(match[2].replace(/\.git$/, ''));
      console.log('Parsed owner:', match[1], 'Parsed repo:', match[2].replace(/\.git$/, ''));
    } else {
      setOwner('');
      setRepoName('');
      console.log('Failed to parse owner/repo from URL:', url);
    }
  };

  return (
    <div>
      <h1>React is working!</h1>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Deployment Step-by-Step Pipeline
          </h1>
          {/* Repo URL Input */}
          <div className="flex flex-col items-center mb-4">
            <input
              type="text"
              placeholder="GitHub Repository URL (e.g. https://github.com/owner/repo)"
              value={repoUrl}
              onChange={handleRepoUrlChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-96"
            />
            <div className="flex space-x-4 mt-2">
              <input
                type="text"
                value={owner}
                readOnly
                placeholder="Owner"
                className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 w-44"
              />
              <input
                type="text"
                value={repoName}
                readOnly
                placeholder="Repository Name"
                className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 w-44"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={startPipeline}
              disabled={isRunning || !owner || !repoName}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <Play className="w-5 h-5" />
              <span>{isRunning ? 'Pipeline Running...' : 'Start Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Visual */}
        <div className="mb-8">
          <PipelineVisual 
            steps={steps} 
            onStepSelect={setSelectedStep}
            selectedStep={selectedStep}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Output Panel */}
          <div className="lg:col-span-2">
            <OutputPanel step={selectedStep} />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;