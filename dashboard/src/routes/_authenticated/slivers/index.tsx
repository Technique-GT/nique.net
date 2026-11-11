import { createFileRoute } from "@tanstack/react-router";
import { AdminOnlyRoute } from "@/components/admin-only-route";
import Slivers from "@/features/stats-moderation/slivers";

export const Route = createFileRoute("/_authenticated/slivers/")({
	component: () => (
		<AdminOnlyRoute>
			<Slivers />
		</AdminOnlyRoute>
	),
});
