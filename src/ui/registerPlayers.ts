import { PivotPlayer } from './PivotPlayer';
import { extraPlayers } from './players';
import { QuizPlayer } from './QuizPlayer';
import { ToolsPlayer } from './ToolsPlayer';

extraPlayers.tools = ToolsPlayer;
extraPlayers.pivot = PivotPlayer;
extraPlayers.quiz = QuizPlayer;
