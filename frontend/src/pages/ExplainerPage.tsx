import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Radar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import {
  TacticalExplanationCard,
  MatchContextPanel,
  SuggestedQuestions,
} from '../features/explainer';
import { cricketService } from '../services/cricketService';
import { aiService } from '../services/aiService';
import { useTactical } from '../context/TacticalContext';
import {
  MatchContext,
  DeliverySummary,
  FieldConfiguration,
} from '../types/cricket';
import { ChatMessage } from '../types/ai';

export const ExplainerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeMatchId, activeDeliveryId, setActiveDeliveryId } = useTactical();

  // URL query params or context defaults
  const matchId = searchParams.get('matchId') || activeMatchId;
  const deliveryId = searchParams.get('deliveryId') || activeDeliveryId;

  // Context State
  const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
  const [delivery, setDelivery] = useState<DeliverySummary | null>(null);
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration | null>(null);

  // Chat & AI State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAI]);

  // 1. Initial Load: Load Match Context and Initial AI Explanation
  const initializeExplainer = useCallback(async () => {
    setIsLoadingContext(true);
    setErrorMessage(null);
    try {
      setActiveDeliveryId(deliveryId);

      const [ctx, deliveriesData, fieldData] = await Promise.all([
        cricketService.getMatchContext(matchId),
        cricketService.getMatchDeliveries(matchId),
        cricketService.getDeliveryField(matchId, deliveryId),
      ]);

      setMatchContext(ctx);
      setFieldConfig(fieldData);

      const currentDeliv = deliveriesData.find((d) => d.id === deliveryId) || deliveriesData[0];
      setDelivery(currentDeliv);

      // Fetch initial grounded AI explanation for this delivery field
      setIsLoadingAI(true);
      try {
        const initialExplanation = await aiService.explainField(matchId, deliveryId);
        setMessages([
          {
            id: 'msg-initial',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            explanation: initialExplanation,
          },
        ]);
      } catch (aiErr) {
        console.warn('Initial AI explanation fallback', aiErr);
      } finally {
        setIsLoadingAI(false);
      }
    } catch (err: any) {
      console.error('Failed to initialize AI Explainer', err);
      setErrorMessage(err?.error?.message || 'Failed to load match context for AI analysis.');
    } finally {
      setIsLoadingContext(false);
    }
  }, [matchId, deliveryId, setActiveDeliveryId]);

  useEffect(() => {
    initializeExplainer();
  }, [initializeExplainer]);

  // 2. Handle Sending User Question
  const handleSendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoadingAI) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoadingAI(true);

    try {
      // Call Gemini Tactical Ask Endpoint
      const aiResponse = await aiService.askQuestion(matchId, deliveryId, trimmed);

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        explanation: aiResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI question query failed', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Tactical analysis stream timed out. DugoutAI grounded engine could not reach the intelligence service. Please verify your connection.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion(inputText);
    }
  };

  if (isLoadingContext) {
    return (
      <div className="py-20">
        <LoadingState
          message="Synthesizing Tactical Duel Intelligence..."
          subtext="Retrieving delivery telemetry, player tendencies, and spatial coordinates for Gemini reasoning"
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="py-20">
        <ErrorState
          title="Tactical AI Link Failed"
          message={errorMessage}
          onRetry={initializeExplainer}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="AI Tactical Explainer"
        subtitle="Decode captaincy decisions, bowling traps, and spatial field changes through grounded AI reasoning."
        badge={<Badge variant="blue" dot>Gemini Intelligence</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-tactical-warning" />}
              onClick={() => navigate(`/simulator?matchId=${matchId}&deliveryId=${deliveryId}`)}
            >
              Test in Shadow Captain
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Radar className="w-3.5 h-3.5 text-brand-lime" />}
              onClick={() => navigate(`/radar?matchId=${matchId}&deliveryId=${deliveryId}`)}
            >
              View in Radar
            </Button>
          </div>
        }
      />

      {/* Epistemological Transparency Notice */}
      <div className="p-4 rounded-2xl glass-subtle flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-content-primary">
            Epistemological Grounding Standard:
          </span>{' '}
          <span className="text-content-secondary">
            DugoutAI models cricket orthodoxy and observable match telemetry. It distinguishes empirical evidence from tactical interpretation, and avoids unverified assumptions of a captain's private thoughts.
          </span>
        </div>
      </div>

      {/* Main Grid: Left Column Context, Right Column Conversational Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Match Context & Suggested Questions */}
        <div className="lg:col-span-4 space-y-4">
          <MatchContextPanel
            context={matchContext}
            delivery={delivery}
            fieldConfig={fieldConfig}
            matchId={matchId}
            deliveryId={deliveryId}
          />

          <SuggestedQuestions
            onSelectQuestion={(q) => handleSendQuestion(q)}
            isLoading={isLoadingAI}
          />
        </div>

        {/* Right Column (8 cols): Conversational Dialogue & Evidence */}
        <div className="lg:col-span-8 flex flex-col space-y-4 min-h-[600px]">
          {/* Chat Messages Feed */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[720px] pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in duration-200">
                {msg.sender === 'user' ? (
                  /* User Message Bubble */
                  <div className="flex justify-end mb-4">
                    <div className="max-w-xl rounded-2xl bg-surface-elevated border border-brand-blue/40 p-4 text-sm text-content-primary shadow-sm">
                      <div className="flex items-center justify-between text-[10px] text-content-muted mb-1 gap-4">
                        <span className="font-semibold text-brand-blue uppercase font-mono">You Asked</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  /* AI Tactical Explanation Card */
                  <div className="mb-4">
                    {msg.explanation ? (
                      <TacticalExplanationCard
                        explanation={msg.explanation}
                        userQuery={msg.text}
                      />
                    ) : (
                      <Card variant="glass" className="p-4 text-sm text-content-secondary">
                        {msg.text}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator during AI Reasoning */}
            {isLoadingAI && (
              <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-brand-blue/30 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-brand-blue animate-spin" />
                <div className="text-xs text-content-secondary">
                  <span className="font-semibold text-content-primary">
                    Synthesizing grounded tactical rationale...
                  </span>{' '}
                  Cross-referencing fielder coordinates, bowler line/length, and batter match-up.
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* User Input Bar */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoadingAI}
                placeholder="Ask DugoutAI about this field placement, specific fielder, or tactical shift..."
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3.5 text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue pr-28 transition-all disabled:opacity-50"
              />
              <div className="absolute right-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendQuestion(inputText)}
                  disabled={!inputText.trim() || isLoadingAI}
                  isLoading={isLoadingAI}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Ask AI
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-muted mt-2 px-1">
              <span>Press Enter to send · Grounded in verified match telemetry</span>
              <span className="font-mono text-brand-lime">Deterministic geometry & Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
