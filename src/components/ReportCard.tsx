import React from 'react';
import { Calendar, FileText, Download, Eye, Clock, BarChart } from 'lucide-react';
import { Report } from '../types';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complété':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'En révision':
        return 'bg-purple-100 text-purple-800';
      case 'Planifié':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <BarChart className="text-blue-600" size={16} />;
      case 'annuel':
        return <Calendar className="text-orange-600" size={16} />;
      case 'trimestriel':
        return <Clock className="text-teal-600" size={16} />;
      default:
        return <FileText className="text-gray-600" size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'performance':
        return 'Performance';
      case 'annuel':
        return 'Annuel';
      case 'trimestriel':
        return 'Trimestriel';
      default:
        return type;
    }
  };

  // Format date to display as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded bg-blue-50">
              {getTypeIcon(report.type)}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {getTypeLabel(report.type)}
            </span>
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-2">{report.title}</h3>
        
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar size={14} className="mr-1" />
          <span>{formatDate(report.date)}</span>
        </div>
        
        {report.progress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${report.progress}%` }}
            ></div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 p-3 flex justify-between">
        <button className="text-gray-600 hover:text-blue-600 text-xs font-medium flex items-center transition-colors">
          <Eye size={14} className="mr-1" />
          Voir
        </button>
        
        {report.status === 'Complété' && (
          <button className="text-gray-600 hover:text-blue-600 text-xs font-medium flex items-center transition-colors">
            <Download size={14} className="mr-1" />
            Télécharger
          </button>
        )}
        
        {report.status !== 'Complété' && (
          <span className="text-xs text-gray-500">
            {report.progress > 0 ? `${report.progress}% complété` : 'À commencer'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReportCard;