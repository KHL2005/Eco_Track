import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, MapPin, Calendar, User, File, Download } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { formatDateTime, labelify } from '../utils/formatters';

export default function CitizenIssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => issuesApi.getIssueById(id).then(r => r.data),
  });

  const { data: resolution } = useQuery({
    queryKey: ['resolution', 'issue', id],
    queryFn: () => issuesApi.getResolutionByIssue(id).then(r => r.data).catch(() => null),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-64 bg-earth-100 rounded-2xl" /></DashboardLayout>;
  if (!issue) return <DashboardLayout><p className="text-bark-400">Issue not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/citizen/issues')}><ArrowLeft size={16} /> Back to My Issues</Button>
        </div>

        <Card className="mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-bark-800">{issue.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-bark-400">
                <span className="flex items-center gap-1"><User size={14} />{issue.citizenName}</span>
                <span className="flex items-center gap-1"><Calendar size={14} />{formatDateTime(issue.createdAt)}</span>
                {issue.location && <span className="flex items-center gap-1"><MapPin size={14} />{issue.location}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={issue.status} />
            </div>
          </div>

          <div className="bg-earth-100 rounded-xl p-4 mb-4">
            <span className="text-xs font-semibold text-bark-400 uppercase tracking-wide">Type</span>
            <p className="text-sm text-bark-800 mt-0.5">{labelify(issue.type)}</p>
          </div>

          <p className="text-bark-600 text-sm leading-relaxed">{issue.description}</p>
        </Card>

         {/* Media */}
         <Card className="mb-4">
           <h3 className="font-semibold text-bark-800 mb-4">Uploaded Media</h3>
           {issue.mediaUrls?.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {issue.mediaUrls.map((url) => {
                 const fileName = url.split('/').pop();
                 const mediaUrl = issuesApi.getMediaUrl(id, fileName);
                 const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                 const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(fileName);

                 return (
                   <div key={url} className="rounded-xl overflow-hidden border border-bark-400/10 bg-bark-100">
                     {isImage ? (
                       <div className="aspect-video bg-earth-100 overflow-hidden">
                         <img
                           src={mediaUrl}
                           alt={fileName}
                           className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                         />
                       </div>
                     ) : isVideo ? (
                       <video
                         controls
                         className="w-full h-auto"
                         style={{ maxHeight: '400px' }}
                       >
                         <source src={mediaUrl} />
                         Your browser does not support the video tag.
                       </video>
                     ) : (
                       <div className="aspect-video bg-earth-100 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                         <File size={40} className="text-bark-400 mb-2" />
                       </div>
                     )}
                     <div className="p-3 flex items-center justify-between">
                       <span className="text-xs text-bark-600 truncate flex-1">{fileName}</span>
                       <a
                         href={mediaUrl}
                         download={fileName}
                         className="ml-2 p-1 text-forest-600 hover:bg-forest-100 rounded transition-colors"
                         title="Download media"
                       >
                         <Download size={16} />
                       </a>
                     </div>
                   </div>
                 );
               })}
             </div>
           ) : (
             <div className="text-center py-8 text-bark-400">
               <File size={32} className="mx-auto mb-2 opacity-50" />
               <p className="text-sm">No media attached to this issue.</p>
             </div>
           )}
         </Card>

        {/* Resolution */}
        <Card>
          <h3 className="font-semibold text-bark-800 mb-4">Resolution</h3>
          {resolution ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={resolution.status} />
                <span className="text-sm text-bark-400">by {resolution.officerName}</span>
              </div>
              <p className="text-sm text-bark-600 leading-relaxed">{resolution.actions}</p>
            </div>
          ) : (
            <p className="text-sm text-bark-400">No resolution recorded yet.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
