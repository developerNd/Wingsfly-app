export type RootStackParamList = {
  Home: undefined;
  DetailedGoal: {
    goalId: string;
    color?: string;
  };
  Tasks: undefined;
  AddTask: undefined;
  EditTask: { taskId: string };
  Goals: undefined;
  AddGoal: undefined;
  EditGoal: { goalId: string };
  Routines: undefined;
  AddRoutine: undefined;
  EditRoutine: { routineId: string };
}; 