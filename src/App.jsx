import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Settings, 
  CheckCircle, 
  RotateCcw, 
  Terminal, 
  FileText, 
  Search, 
  BookOpen, 
  Edit3, 
  AlertTriangle,
  ArrowRight,
  Eye,
  Key,
  Database,
  Download,
  MessageSquare,
  Send
} from 'lucide-react';
import { runCollaboration, runChatAssistant } from './agents';

export default function App() {
  const [task, setTask] = useState('Create a detailed outline and essay explaining the mechanics of Quantum Cryptography');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('idle');
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'output', 'chat'
  const [finalOutput, setFinalOutput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I am your coordinator assistant. I can help analyze your drafts, summarize research, or answer questions about our multi-agent workflow. How can I help you today?', 
      timestamp: new Date().toLocaleTimeString() 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  
  const terminalEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Save API key to local storage
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // Scroll to bottom of timeline logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Scroll to bottom of chat history
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatTyping]);

  const handleStart = async () => {
    setIsRunning(true);
    setLogs([]);
    setFinalOutput('');
    setActiveTab('timeline');
    
    await runCollaboration({
      task,
      apiKey: apiKey.trim(),
      onStepUpdate: ({ logs, currentStatus, step, finalOutput }) => {
        setLogs(logs);
        setCurrentStatus(currentStatus);
        setStep(step);
        if (finalOutput) {
          setFinalOutput(finalOutput);
          setActiveTab('output');
        }
      }
    });

    setIsRunning(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([finalOutput], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${task.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_document.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage, timestamp: new Date().toLocaleTimeString() }]);
    setIsChatTyping(true);

    const response = await runChatAssistant({
      message: userMessage,
      history: chatHistory,
      finalOutput,
      apiKey: apiKey.trim()
    });

    setChatHistory(prev => [...prev, { sender: 'bot', text: response, timestamp: new Date().toLocaleTimeString() }]);
    setIsChatTyping(false);
  };

  const formatChatMessage = (text) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }
      
      const elementContent = parts.length > 0 ? parts : content;

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem', listStyleType: 'decimal' }}>{line.replace(/^\d+\.\s/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '0.5rem' }} />;
      }
      return <p key={idx} style={{ marginBottom: '0.5rem' }}>{elementContent}</p>;
    });
  };

  // Determine active agent based on state status
  const getActiveAgentIndex = () => {
    if (currentStatus === 'idle') return -1;
    if (currentStatus.includes('research')) return 0;
    if (currentStatus.includes('write') || currentStatus.includes('draft')) return 1;
    if (currentStatus.includes('review') || currentStatus.includes('critique')) return 2;
    if (currentStatus === 'completed') return 3;
    return -1;
  };

  const activeAgentIndex = getActiveAgentIndex();

  return (
    <div className="app-container">
      <header>
        <div className="header-title">
          <Terminal size={28} className="text-primary" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h1>Synapse Collaboration Engine</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multi-Agent Cooperative LLM Workflow</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${apiKey ? 'badge-success' : 'badge-primary'}`}>
            {apiKey ? 'API Live Mode' : 'Simulation Mode'}
          </span>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Sidebar Controls */}
        <section className="sidebar-panel glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> Controls & Config
          </h2>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Gemini API Key</span>
              <button 
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
              >
                <Eye size={12} /> {isApiKeyVisible ? 'Hide' : 'Show'}
              </button>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={isApiKeyVisible ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="Enter Gemini API key for real run..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            {!apiKey && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={12} /> Running in local mock/simulation mode.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Collaborative Task</label>
            <textarea 
              className="form-textarea"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={isRunning}
              placeholder="Describe the task you want the agent team to complete..."
            />
          </div>

          <button 
            className="btn"
            disabled={isRunning || !task.trim()}
            onClick={handleStart}
            style={{ width: '100%', padding: '1rem' }}
          >
            {isRunning ? (
              <>
                <span className="spinner">⌛</span> Running Collaboration...
              </>
            ) : (
              <>
                <Play size={16} /> Run Agent Loop
              </>
            )}
          </button>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Agent Protocol Structure</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                <strong>Researcher Agent:</strong> Gathers facts & outline
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#a855f7' }}></div>
                <strong>Writer Agent:</strong> Composes drafts & revisions
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                <strong>Reviewer Agent:</strong> Evaluates, rates & approves
              </div>
            </div>
          </div>
        </section>

        {/* Main Work Area */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Agent workflow tracking track */}
          <div className="agents-track">
            <div className="agents-track-line">
              <div 
                className="agents-track-line-progress"
                style={{ 
                  width: activeAgentIndex === -1 ? '0%' : 
                         activeAgentIndex === 0 ? '25%' : 
                         activeAgentIndex === 1 ? '50%' : 
                         activeAgentIndex === 2 ? '75%' : '100%' 
                }}
              />
            </div>
            
            <div className={`agent-node ${activeAgentIndex === 0 ? 'active' : ''}`}>
              <div className="agent-node-icon" style={{ borderColor: activeAgentIndex === 0 ? '#3b82f6' : '' }}>
                <Search size={20} />
              </div>
              <span className="agent-node-name">Resource</span>
            </div>

            <ArrowRight size={16} className="text-muted" style={{ zIndex: 2 }} />

            <div className={`agent-node ${activeAgentIndex === 1 ? 'active' : ''}`}>
              <div className="agent-node-icon" style={{ borderColor: activeAgentIndex === 1 ? '#a855f7' : '' }}>
                <Edit3 size={20} />
              </div>
              <span className="agent-node-name">Writer</span>
            </div>

            <ArrowRight size={16} className="text-muted" style={{ zIndex: 2 }} />

            <div className={`agent-node ${activeAgentIndex === 2 ? 'active' : ''}`}>
              <div className="agent-node-icon" style={{ borderColor: activeAgentIndex === 2 ? '#10b981' : '' }}>
                <BookOpen size={20} />
              </div>
              <span className="agent-node-name">Reviewer</span>
            </div>

            <ArrowRight size={16} className="text-muted" style={{ zIndex: 2 }} />

            <div className={`agent-node ${activeAgentIndex === 3 ? 'active' : ''}`}>
              <div className="agent-node-icon" style={{ borderColor: activeAgentIndex === 3 ? '#22c55e' : '' }}>
                <CheckCircle size={20} />
              </div>
              <span className="agent-node-name">Finished</span>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="content-tabs">
            <button 
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Collaboration Logs ({logs.length})
            </button>
            {finalOutput && (
              <button 
                className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                Final Output Artifact
              </button>
            )}
            <button 
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat Assistant
            </button>
          </div>

          <div className="main-display">
            {activeTab === 'timeline' ? (
              <div className="timeline">
                {logs.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', gap: '1rem' }}>
                    <Database size={48} strokeWidth={1} />
                    <p>Enter a task and start the loop to see logs of collaboration</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="timeline-item">
                      <div 
                        className="timeline-avatar"
                        style={{ 
                          backgroundColor: log.agent.includes('Researcher') ? 'rgba(59, 130, 246, 0.15)' :
                                           log.agent.includes('Writer') ? 'rgba(168, 85, 247, 0.15)' :
                                           log.agent.includes('Reviewer') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: log.agent.includes('Researcher') ? '#3b82f6' :
                                 log.agent.includes('Writer') ? '#a855f7' :
                                 log.agent.includes('Reviewer') ? '#10b981' : '#ef4444',
                          border: `1px solid ${
                            log.agent.includes('Researcher') ? 'rgba(59, 130, 246, 0.3)' :
                            log.agent.includes('Writer') ? 'rgba(168, 85, 247, 0.3)' :
                            log.agent.includes('Reviewer') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                          }`
                        }}
                      >
                        {log.agent.includes('Researcher') ? <Search size={18} /> :
                         log.agent.includes('Writer') ? <Edit3 size={18} /> :
                         log.agent.includes('Reviewer') ? <BookOpen size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-author">{log.agent}</span>
                          <span className="timeline-time">{log.timestamp}</span>
                        </div>
                        <div className="timeline-action">{log.action}</div>
                        <div className="timeline-body">{log.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            ) : activeTab === 'output' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Download size={14} /> Download Markdown (.md)
                  </button>
                </div>
                <div className="markdown-body glass-panel" style={{ background: 'var(--bg-primary)' }}>
                  {finalOutput.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i}>{line.replace('# ', '')}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={i}>{line.replace('## ', '')}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={i}>{line.replace('### ', '')}</h3>;
                    } else if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <li key={i}>{line.replace(/^[-*]\s+/, '')}</li>;
                    } else if (line.trim() === '') {
                      return <br key={i} />;
                    } else {
                      return <p key={i}>{line}</p>;
                    }
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                {/* Chat Header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} className="text-primary" style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Coordinator Assistant</span>
                </div>

                {/* Messages Body */}
                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1.25rem' }}>
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        gap: '0.75rem',
                        flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: `1px solid ${msg.sender === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        color: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--color-success)'
                      }}>
                        {msg.sender === 'user' ? 'U' : 'AI'}
                      </div>

                      {/* Message Bubble */}
                      <div style={{
                        maxWidth: '75%',
                        padding: '0.75rem 1rem',
                        borderRadius: msg.sender === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                        fontSize: '0.92rem',
                        lineHeight: 1.5,
                        background: msg.sender === 'user' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
                        color: '#fff',
                        border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        <div>{formatChatMessage(msg.text)}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.35rem', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isChatTyping && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: 'var(--color-success)'
                      }}>
                        AI
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.75rem 1rem', borderRadius: '2px 12px 12px 12px', fontSize: '0.9rem' }}>
                        Typing<span className="spinner" style={{ marginLeft: '0.25rem' }}>...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Input Bar */}
                <form 
                  onSubmit={handleSendChatMessage} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    borderTop: '1px solid var(--border-color)', 
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex', 
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="text"
                    className="form-input"
                    style={{ flexGrow: 1, borderRadius: '24px', background: 'var(--bg-primary)' }}
                    placeholder="Ask a question about the generated document..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatTyping}
                  />
                  <button 
                    type="submit" 
                    className="btn" 
                    disabled={isChatTyping || !chatInput.trim()} 
                    style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
