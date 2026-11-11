import { createFileRoute } from "@tanstack/react-router";
import { AdminOnlyRoute } from "@/components/admin-only-route";
import Analysis from "@/features/stats-moderation/analytics";

export const Route = createFileRoute("/_authenticated/stats/")({
	component: () => (
		<AdminOnlyRoute>
			<Analysis />
		</AdminOnlyRoute>
	),
});
