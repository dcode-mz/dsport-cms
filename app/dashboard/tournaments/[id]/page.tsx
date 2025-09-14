// app/tournament/[id]/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentHeader } from "../../../../components/tournament-header";
import { TeamsTab } from "../../../../components/tournament-teams-tab";
import { MatchesTab } from "../../../../components/tournament-matches-tab";
import { StandingsTab } from "../../../../components/tournament-standings-tab";
import { ResponseBody } from "@/app/types/response-body";
import { Tournament } from "@/app/types/tournament";
import { TeamCharacteristics } from "@/app/types/team";
import { PlayersTab } from "@/components/tournament-players-tab";

export default async function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  // const handleStageCreated = () => {
  //   console.log("Stage created");
  // };

  // const handleStageUpdated = () => {
  //   console.log("Stage updated");
  // };

  // const handleStageDeleted = () => {
  //   console.log("Stage deleted");
  // };

  // const handleMatchdayCreated = () => {
  //   console.log("Matchday created");
  // };

  // const handleMatchdayUpdated = () => {
  //   console.log("Matchday updated");
  // };

  // const handleMatchdayDeleted = () => {
  //   console.log("Matchday deleted");
  // };

  // const handleMatchCreated = () => {
  //   console.log("Match created");
  // };

  // const handleMatchUpdated = () => {
  //   console.log("Match updated");
  // };

  // const handleMatchDeleted = () => {
  //   console.log("Match deleted");
  // };
  const { id } = await params;
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/tournament/${id}`);
  const tournament: ResponseBody<Tournament> = await response.json();

  const responseTeamCharacteristcs = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/team/characteristics`
  );
  const { payload }: ResponseBody<TeamCharacteristics> =
    await responseTeamCharacteristcs.json();
  const categoryId = payload.categories.find(
    (cat) => cat.name === tournament.payload.category.name
  )?.id;
  const genderId = payload.genders.find(
    (gender) => gender.name === tournament.payload.gender.name
  )?.id;
  const sportId = payload.sports.find(
    (sport) => sport.name === tournament.payload.sport.name
  )?.id;

  const responseTeams = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/team/filters?gender=${genderId}&sport=${sportId}&ageCategory=${categoryId}`
  );

  const availableTournamentTeams: ResponseBody<
    { id: string; name: string; club: { name: string; logo: string } }[]
  > = await responseTeams.json();

  const responseStageTypes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/stage/types`);
  const stageTypes = await responseStageTypes.json();

  const responseReferees = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/referee`);
  const referees = await responseReferees.json();

  const responseVenue = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/venue`);
  const venues = await responseVenue.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <TournamentHeader tournament={tournament.payload} />

      <Tabs defaultValue="teams" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">Equipas</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="matches">Jogos</TabsTrigger>
          <TabsTrigger value="standings">Classificação</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <TeamsTab
            availableTournamentTeams={availableTournamentTeams.payload}
            tournament={tournament.payload}
          />
        </TabsContent>
        <TabsContent value="players">
          <PlayersTab tournament={tournament.payload} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchesTab
            tournament={tournament.payload}
            availableTournamentTeams={availableTournamentTeams.payload}
            stageTypes={stageTypes}
            referees={referees.payload}
            venues={venues.payload}
            // onStageCreated={handleStageCreated}
            // onStageUpdated={handleStageUpdated}
            // onStageDeleted={handleStageDeleted}
            // onMatchdayCreated={handleMatchdayCreated}
            // onMatchdayUpdated={handleMatchdayUpdated}
            // onMatchdayDeleted={handleMatchdayDeleted}
            // onMatchCreated={handleMatchCreated}
            // onMatchUpdated={handleMatchUpdated}
            // onMatchDeleted={handleMatchDeleted}
          />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTab tournament={tournament.payload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
