import type { ExportStatus } from './declaration';

export function classifyExportStatus(name: string): ExportStatus {
	const first = name.charAt(0);
	return first >= 'A' && first <= 'Z' ? 'exported' : 'unexported';
}
